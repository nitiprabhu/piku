from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from app.database import get_db
from app.models.publish_job import InspirationVideo

router = APIRouter(prefix="/inspire", tags=["inspire"])


class InspirationVideoResponse(BaseModel):
    id: str
    title: str
    prompt: str
    category: str
    language: str
    video_url: str | None
    thumbnail_url: str | None
    duration_s: int | None
    sort_order: int

    model_config = {"from_attributes": True}


@router.get("", response_model=list[InspirationVideoResponse])
async def list_inspiration_videos(
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    filters = [InspirationVideo.is_active == True]
    if category:
        filters.append(InspirationVideo.category == category)

    result = await db.execute(
        select(InspirationVideo).where(and_(*filters)).order_by(InspirationVideo.sort_order)
    )
    return [InspirationVideoResponse.model_validate(v) for v in result.scalars().all()]
