from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from app.database import get_db
from app.models.publish_job import Template

router = APIRouter(prefix="/templates", tags=["templates"])


class TemplateResponse(BaseModel):
    id: str
    name: str
    category: str | None
    language: str | None
    prompt_examples: list[str] | None
    style_config: dict | None
    thumbnail_url: str | None
    sort_order: int

    model_config = {"from_attributes": True}


@router.get("", response_model=list[TemplateResponse])
async def list_templates(
    category: str | None = Query(None),
    language: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    filters = [Template.is_active == True]
    if category:
        filters.append(Template.category == category)
    if language:
        filters.append(Template.language == language)

    result = await db.execute(
        select(Template).where(and_(*filters)).order_by(Template.sort_order)
    )
    return [TemplateResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse.model_validate(template)
