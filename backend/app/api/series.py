import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.series import Series, SeriesEpisode
from app.models.publish_job import CreditTransaction
from app.core.security import get_current_user

router = APIRouter(prefix="/series", tags=["series"])


class CreateSeriesRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    topic: str = Field(..., min_length=10, max_length=1000)
    style: str = Field("storytelling", pattern="^(funny|devotional|motivation|business|news|storytelling)$")
    language: str = Field("hi", pattern="^(hi|en|hinglish)$")
    voice_id: str = Field("rohit_m", pattern="^(rohit_m|priya_f|arjun_m|ananya_f)$")
    duration_target: int = Field(60, ge=30, le=90)
    caption_mode: str = Field("full_sentence", pattern="^(full_sentence|keyword_pop)$")


class UpdateSeriesScheduleRequest(BaseModel):
    schedule_type: str = Field(..., pattern="^(manual|daily|every_3_days|weekly)$")
    schedule_time: str = Field("09:00", pattern="^([01]\\d|2[0-3]):[0-5]\\d$")
    caption_mode: str | None = Field(None, pattern="^(full_sentence|keyword_pop)$")


class SeriesResponse(BaseModel):
    id: uuid.UUID
    name: str
    topic: str
    style: str
    language: str
    voice_id: str
    duration_target: int
    episode_count: int
    caption_mode: str
    schedule_type: str
    schedule_time: str
    next_run_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class EpisodeResponse(BaseModel):
    id: uuid.UUID
    episode_number: int
    generated_prompt: str
    project_id: uuid.UUID | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateEpisodeResponse(BaseModel):
    episode_id: uuid.UUID
    project_id: uuid.UUID
    job_id: str


@router.post("", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
async def create_series(
    body: CreateSeriesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = Series(
        user_id=current_user.id,
        name=body.name,
        topic=body.topic,
        style=body.style,
        language=body.language,
        voice_id=body.voice_id,
        duration_target=body.duration_target,
        caption_mode=body.caption_mode,
    )
    db.add(series)
    await db.flush()
    return series


@router.get("", response_model=list[SeriesResponse])
async def list_series(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Series)
        .where(Series.user_id == current_user.id, Series.is_deleted == False)
        .order_by(Series.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{series_id}", response_model=SeriesResponse)
async def get_series(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = await _get_owned_series(series_id, current_user.id, db)
    return series


@router.get("/{series_id}/episodes", response_model=list[EpisodeResponse])
async def list_episodes(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_series(series_id, current_user.id, db)
    result = await db.execute(
        select(SeriesEpisode)
        .where(SeriesEpisode.series_id == series_id)
        .order_by(SeriesEpisode.episode_number.asc())
    )
    return result.scalars().all()


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_series(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = await _get_owned_series(series_id, current_user.id, db)
    series.is_deleted = True


@router.patch("/{series_id}/schedule", response_model=SeriesResponse)
async def update_series_schedule(
    series_id: uuid.UUID,
    body: UpdateSeriesScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.scheduler import compute_next_run_at
    series = await _get_owned_series(series_id, current_user.id, db)
    series.schedule_type = body.schedule_type
    series.schedule_time = body.schedule_time
    series.next_run_at = compute_next_run_at(body.schedule_type, body.schedule_time)
    if body.caption_mode:
        series.caption_mode = body.caption_mode
    await db.flush()
    return series


@router.post("/{series_id}/generate", response_model=GenerateEpisodeResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_episode(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.config import settings
    import openai
    import redis as sync_redis
    import rq

    series = await _get_owned_series(series_id, current_user.id, db)

    # Atomic credit deduction
    result = await db.execute(
        text("UPDATE users SET credits = credits - 1 WHERE id = :id AND credits > 0 RETURNING credits"),
        {"id": str(current_user.id)},
    )
    if result.fetchone() is None:
        raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")

    # Fetch last 10 episode prompts for continuity context
    prior_result = await db.execute(
        select(SeriesEpisode.generated_prompt)
        .where(SeriesEpisode.series_id == series_id)
        .order_by(SeriesEpisode.episode_number.desc())
        .limit(10)
    )
    prior_prompts = [r[0] for r in prior_result.fetchall()]
    prior_prompts.reverse()

    episode_number = series.episode_count + 1

    # GPT generates contextual episode prompt
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    prior_context = (
        "\n".join(f"Ep {i+1}: {p}" for i, p in enumerate(prior_prompts))
        if prior_prompts else "None yet."
    )
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You generate focused video prompts for Indian short-form content series. Return ONLY the prompt text — no labels, no JSON, no quotes.",
            },
            {
                "role": "user",
                "content": (
                    f'Series: "{series.name}"\n'
                    f"Universe/Topic: {series.topic}\n"
                    f"Style: {series.style}\n"
                    f"Episode: {episode_number}\n\n"
                    f"Previous episodes (avoid repeating, maintain continuity):\n{prior_context}\n\n"
                    f"Generate ONE focused video prompt for episode {episode_number}. "
                    "New angle or scene, same universe. Continue narrative arc naturally."
                ),
            },
        ],
        temperature=1.0,
        max_tokens=300,
    )
    generated_prompt = resp.choices[0].message.content.strip().strip('"').strip("'")

    # Create episode row
    episode = SeriesEpisode(
        series_id=series_id,
        user_id=current_user.id,
        episode_number=episode_number,
        generated_prompt=generated_prompt,
        status="processing",
    )
    db.add(episode)

    # Create project row
    project = Project(
        user_id=current_user.id,
        input_prompt=generated_prompt,
        language=series.language,
        style=series.style,
        voice_id=series.voice_id,
        duration_target=series.duration_target,
        caption_mode=series.caption_mode,
        status="pending",
        title=f"{series.name} — Ep {episode_number}",
    )
    db.add(project)

    tx = CreditTransaction(
        user_id=current_user.id,
        delta=-1,
        reason="series_episode",
        project_id=project.id,
    )
    db.add(tx)
    await db.flush()

    # Enqueue RQ job
    redis_conn = sync_redis.Redis.from_url(settings.REDIS_URL)
    queue = rq.Queue("default", connection=redis_conn)
    job = queue.enqueue(
        "app.workers.video_worker.process_video_job",
        project_id=str(project.id),
        prompt=generated_prompt,
        language=series.language,
        style=series.style,
        voice_id=series.voice_id,
        duration=series.duration_target,
        user_plan=current_user.plan,
        caption_mode=series.caption_mode,
        job_timeout=600,
    )

    project.job_id = job.id
    episode.project_id = project.id
    series.episode_count = episode_number
    await db.flush()

    return GenerateEpisodeResponse(episode_id=episode.id, project_id=project.id, job_id=job.id)


async def _get_owned_series(series_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Series:
    result = await db.execute(
        select(Series).where(Series.id == series_id, Series.user_id == user_id, Series.is_deleted == False)
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return series
