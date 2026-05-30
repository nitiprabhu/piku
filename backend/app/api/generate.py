import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.publish_job import CreditTransaction
from app.core.security import get_current_user
import redis as sync_redis
import rq
import json

router = APIRouter(prefix="/generate", tags=["generation"])


VALID_CHARACTERS = {"raju_bhaiya", "priya_di", "professor_sharma", "rohit_anchor", "dev_startup", "pandit_gyani"}

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=500)
    language: str = Field("hi", pattern="^(hi|en|hinglish|kn)$")
    style: str = Field("motivation", pattern="^(funny|devotional|motivation|business|news|storytelling|mystery|facts|daily_routine|outfit_check|dance_trend|travel_vlog|product_review)$")
    voice_id: str = Field("rohit_m", pattern="^(rohit_m|priya_f|arjun_m|ananya_f|kavya_f|vikram_m)$")
    duration: int = Field(60, ge=30, le=90)
    template_id: str | None = None
    character: str | None = None
    enable_captions: bool = True


class GenerateResponse(BaseModel):
    project_id: uuid.UUID
    job_id: str
    estimated_seconds: int = 45


class StatusResponse(BaseModel):
    status: str
    percent: int
    step: str
    video_url: str | None = None
    thumbnail_url: str | None = None
    error: str | None = None


@router.post("", response_model=GenerateResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_generation(
    body: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.config import settings

    # Duration gate: free plan capped at 30s
    free_plan = (current_user.plan or "free") == "free"
    if free_plan and body.duration > 30:
        raise HTTPException(
            status_code=403,
            detail="Free plan is limited to 30-second reels. Upgrade to unlock 60s.",
        )

    # Atomic credit deduction — only deduct if credits > 0
    result = await db.execute(
        text(
            "UPDATE users SET credits = credits - 1 "
            "WHERE id = :id AND credits > 0 "
            "RETURNING credits"
        ),
        {"id": str(current_user.id)},
    )
    row = result.fetchone()
    if row is None:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits. Please upgrade your plan.",
        )

    # Create project row
    project = Project(
        user_id=current_user.id,
        input_prompt=body.prompt,
        language=body.language,
        style=body.style,
        voice_id=body.voice_id,
        duration_target=body.duration,
        template_id=body.template_id,
        status="pending",
        title=body.prompt[:80],
    )
    db.add(project)

    # Log credit transaction
    tx = CreditTransaction(
        user_id=current_user.id,
        delta=-1,
        reason="generation",
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
        prompt=body.prompt,
        language=body.language,
        style=body.style,
        voice_id=body.voice_id,
        duration=body.duration,
        user_plan=current_user.plan,
        character=body.character,
        enable_captions=body.enable_captions,
        job_timeout=600,
    )

    project.job_id = job.id
    await db.flush()

    return GenerateResponse(project_id=project.id, job_id=job.id)


class IdeaRequest(BaseModel):
    style: str = Field("motivation", pattern="^(funny|devotional|motivation|business|news|storytelling)$")
    language: str = Field("hi", pattern="^(hi|en|hinglish|kn)$")


class IdeaResponse(BaseModel):
    prompt: str


@router.post("/idea", response_model=IdeaResponse)
async def generate_idea(
    body: IdeaRequest,
    current_user: User = Depends(get_current_user),
):
    from app.config import settings
    import openai

    lang_map = {"hi": "Hindi", "en": "English", "hinglish": "Hinglish (mix of Hindi and English)", "kn": "Kannada (ಕನ್ನಡ — write the idea in Kannada script)"}
    style_map = {
        "funny": "comedy and humor for Indian audiences — desi situations, relatable family moments, jugaad culture",
        "devotional": "Indian devotional and spiritual content — shlokas, bhajans, life wisdom from scriptures",
        "motivation": "motivational content for Indian creators — overcoming struggles, chasing dreams, hustle",
        "business": "business and entrepreneurship tips for Indian small businesses and startups",
        "news": "news and current affairs commentary for Indian audiences",
        "storytelling": "emotional short stories for Indian audiences — personal journeys, slice-of-life, real human moments with a strong narrative arc",
    }

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You write creative, specific reel prompt ideas for Indian short-video creators. "
                    "A good prompt describes WHAT happens in the video, the angle, and the emotional hook. "
                    "Return ONLY the prompt text — one sentence to one paragraph, no labels, no quotes."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Generate a single fresh, specific reel idea for the style: {style_map[body.style]}. "
                    f"Language: {lang_map[body.language]}. "
                    "Be creative, specific, and ready-to-use. Not generic. One idea only."
                ),
            },
        ],
        temperature=1.1,
        max_tokens=200,
    )
    prompt = resp.choices[0].message.content.strip().strip('"').strip("'")
    return IdeaResponse(prompt=prompt)


@router.get("/status/{job_id}", response_model=StatusResponse)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.config import settings

    redis_conn = sync_redis.Redis.from_url(settings.REDIS_URL)

    # Try to get latest progress from Redis
    cached = redis_conn.get(f"job_status:{job_id}")
    if cached:
        data = json.loads(cached)
        return StatusResponse(**data)

    # Fallback: check project in DB
    result = await db.execute(
        select(Project).where(Project.job_id == job_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Job not found")

    status_map = {
        "pending": ("pending", 0, "queued"),
        "processing": ("processing", 10, "starting"),
        "completed": ("completed", 100, "completed"),
        "failed": ("failed", 0, "failed"),
    }
    st, pct, step = status_map.get(project.status, ("pending", 0, "queued"))

    return StatusResponse(
        status=st,
        percent=pct,
        step=step,
        video_url=project.video_url,
        error=project.error_message,
    )
