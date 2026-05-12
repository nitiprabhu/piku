from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/user", tags=["user"])


class UpdateUserRequest(BaseModel):
    name: str | None = None
    language_pref: str | None = None
    category_pref: str | None = None


class CreditsResponse(BaseModel):
    remaining: int
    plan: str


class UsageResponse(BaseModel):
    videos_this_month: int
    total_videos: int
    published_count: int


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name
    if body.language_pref is not None:
        current_user.language_pref = body.language_pref
    if body.category_pref is not None:
        current_user.category_pref = body.category_pref
    await db.flush()
    return UserResponse.model_validate(current_user)


@router.get("/credits", response_model=CreditsResponse)
async def get_credits(current_user: User = Depends(get_current_user)):
    return CreditsResponse(remaining=current_user.credits, plan=current_user.plan)


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.project import Project
    from app.models.publish_job import PublishJob
    from sqlalchemy import func, and_
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_res = await db.execute(
        select(func.count()).where(
            and_(Project.user_id == current_user.id, Project.is_deleted == False)
        )
    )
    total = total_res.scalar() or 0

    month_res = await db.execute(
        select(func.count()).where(
            and_(
                Project.user_id == current_user.id,
                Project.is_deleted == False,
                Project.created_at >= month_start,
            )
        )
    )
    month = month_res.scalar() or 0

    pub_res = await db.execute(
        select(func.count()).where(
            and_(PublishJob.user_id == current_user.id, PublishJob.status == "published")
        )
    )
    published = pub_res.scalar() or 0

    return UsageResponse(videos_this_month=month, total_videos=total, published_count=published)
