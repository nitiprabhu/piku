from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid
import httpx
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.publish_job import PublishJob
from app.core.security import get_current_user, encrypt_token, decrypt_token
from app.config import settings

router = APIRouter(prefix="/social", tags=["social"])


class SocialStatusResponse(BaseModel):
    instagram: dict
    youtube: dict


class PublishRequest(BaseModel):
    project_id: uuid.UUID
    caption: str
    hashtags: list[str] = []
    title: str | None = None  # YouTube only


@router.get("/status", response_model=SocialStatusResponse)
async def social_status(current_user: User = Depends(get_current_user)):
    return SocialStatusResponse(
        instagram={
            "connected": bool(current_user.ig_access_token),
            "user_id": current_user.ig_user_id,
        },
        youtube={
            "connected": bool(current_user.yt_access_token),
            "channel_id": current_user.yt_channel_id,
        },
    )


# ─── Instagram OAuth ───────────────────────────────────────────────────────────

@router.get("/instagram/connect")
async def instagram_connect():
    from fastapi.responses import RedirectResponse

    scope = "instagram_basic,instagram_content_publish,pages_read_engagement"
    url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={settings.INSTAGRAM_APP_ID}"
        f"&redirect_uri={settings.FRONTEND_URL}/api/social/instagram/callback"
        f"&scope={scope}"
        f"&response_type=code"
    )
    return RedirectResponse(url)


@router.get("/instagram/callback")
async def instagram_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            data={
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "redirect_uri": f"{settings.FRONTEND_URL}/api/social/instagram/callback",
                "code": code,
            },
        )
        resp.raise_for_status()
        token_data = resp.json()
        access_token = token_data["access_token"]

        # Get IG user ID
        me_resp = await client.get(
            "https://graph.instagram.com/me",
            params={"fields": "id,username", "access_token": access_token},
        )
        me_data = me_resp.json()

    current_user.ig_access_token = encrypt_token(access_token)
    current_user.ig_user_id = me_data.get("id")
    await db.flush()

    return {"connected": True, "username": me_data.get("username")}


@router.post("/instagram/publish")
async def instagram_publish(
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.ig_access_token:
        raise HTTPException(status_code=400, detail="Instagram not connected")

    result = await db.execute(
        select(Project).where(
            and_(Project.id == body.project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project or not project.video_url:
        raise HTTPException(status_code=404, detail="Project not found or video not ready")

    publish_job = PublishJob(
        project_id=project.id,
        user_id=current_user.id,
        platform="instagram",
        status="pending",
        caption=body.caption,
        hashtags=body.hashtags,
    )
    db.add(publish_job)
    await db.flush()

    # Actual IG publish via Meta Graph API (async via worker in v1.1)
    # For MVP: direct synchronous publish
    try:
        access_token = decrypt_token(current_user.ig_access_token)
        full_caption = body.caption + "\n" + " ".join(body.hashtags)

        async with httpx.AsyncClient(timeout=60) as client:
            # Step 1: Create media container
            container_resp = await client.post(
                f"https://graph.instagram.com/v18.0/{current_user.ig_user_id}/media",
                params={
                    "video_url": project.video_url,
                    "caption": full_caption,
                    "media_type": "REELS",
                    "access_token": access_token,
                },
            )
            container_data = container_resp.json()
            container_id = container_data.get("id")

            if not container_id:
                raise Exception(f"Failed to create IG container: {container_data}")

            # Step 2: Publish container
            publish_resp = await client.post(
                f"https://graph.instagram.com/v18.0/{current_user.ig_user_id}/media_publish",
                params={"creation_id": container_id, "access_token": access_token},
            )
            publish_data = publish_resp.json()

        publish_job.status = "published"
        publish_job.platform_post_id = publish_data.get("id")
        from datetime import datetime, timezone
        publish_job.published_at = datetime.now(timezone.utc)

    except Exception as e:
        publish_job.status = "failed"
        publish_job.error_message = str(e)

    await db.flush()
    return {"publish_job_id": str(publish_job.id), "status": publish_job.status}


# ─── YouTube OAuth ─────────────────────────────────────────────────────────────

@router.get("/youtube/connect")
async def youtube_connect():
    from fastapi.responses import RedirectResponse

    scope = "https://www.googleapis.com/auth/youtube.upload"
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.YOUTUBE_CLIENT_ID}"
        f"&redirect_uri={settings.FRONTEND_URL}/api/social/youtube/callback"
        f"&scope={scope}"
        f"&response_type=code"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return RedirectResponse(url)


@router.get("/youtube/callback")
async def youtube_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "redirect_uri": f"{settings.FRONTEND_URL}/api/social/youtube/callback",
                "code": code,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_resp.json()

    current_user.yt_access_token = encrypt_token(token_data["access_token"])
    current_user.yt_refresh_token = encrypt_token(token_data.get("refresh_token", ""))
    await db.flush()

    return {"connected": True}


@router.post("/youtube/publish")
async def youtube_publish(
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.yt_access_token:
        raise HTTPException(status_code=400, detail="YouTube not connected")

    result = await db.execute(
        select(Project).where(
            and_(Project.id == body.project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    if not project or not project.video_url:
        raise HTTPException(status_code=404, detail="Project not found or video not ready")

    publish_job = PublishJob(
        project_id=project.id,
        user_id=current_user.id,
        platform="youtube",
        status="pending",
        caption=body.caption,
        hashtags=body.hashtags,
    )
    db.add(publish_job)
    await db.flush()

    return {
        "publish_job_id": str(publish_job.id),
        "status": "pending",
        "message": "YouTube publish queued",
    }
