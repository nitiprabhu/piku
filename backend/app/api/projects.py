from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
import uuid
import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.core.security import get_current_user
from app.schemas.user import UserResponse

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    input_prompt: str
    language: str
    style: str | None
    voice_id: str | None
    duration_target: int | None
    status: str
    job_id: str | None
    script_json: dict | None
    video_url: str | None
    thumbnail_url: str | None
    duration_actual: int | None
    viral_score: float | None
    caption_text: str | None
    hashtags: list[str] | None
    error_message: str | None
    created_at: datetime.datetime


    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    limit: int


class PatchProjectRequest(BaseModel):
    caption: str | None = None
    hashtags: list[str] | None = None
    title: str | None = None


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = [Project.user_id == current_user.id, Project.is_deleted == False]
    if status:
        filters.append(Project.status == status)

    count_res = await db.execute(select(func.count()).where(and_(*filters)))
    total = count_res.scalar() or 0

    result = await db.execute(
        select(Project)
        .where(and_(*filters))
        .order_by(Project.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    projects = result.scalars().all()

    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id, Project.is_deleted == False)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def patch_project(
    project_id: uuid.UUID,
    body: PatchProjectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id, Project.is_deleted == False)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.caption is not None:
        project.caption_text = body.caption
    if body.hashtags is not None:
        project.hashtags = body.hashtags
    if body.title is not None:
        project.title = body.title

    await db.flush()
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id, Project.is_deleted == False)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.is_deleted = True
    await db.flush()
