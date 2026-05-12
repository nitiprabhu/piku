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
    language: str = Field("hi", pattern="^(hi|en|hinglish)$")
    style: str = Field("motivation", pattern="^(funny|devotional|motivation|business|news)$")
    voice_id: str = Field("rohit_m", pattern="^(rohit_m|priya_f|arjun_m|ananya_f)$")
    duration: int = Field(60, ge=30, le=90)
    template_id: str | None = None
    character: str | None = None


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
        job_timeout=600,
    )

    project.job_id = job.id
    await db.flush()

    return GenerateResponse(project_id=project.id, job_id=job.id)


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
