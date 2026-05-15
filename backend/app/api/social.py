from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid
import httpx
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.publish_job import PublishJob
from app.models.social_account import SocialAccount
from app.core.security import get_current_user, get_current_user_from_token, encrypt_token, decrypt_token
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


async def _get_social_account(db: AsyncSession, user_id: uuid.UUID, platform: str) -> SocialAccount | None:
    result = await db.execute(
        select(SocialAccount).where(
            and_(SocialAccount.user_id == user_id, SocialAccount.platform == platform)
        )
    )
    return result.scalar_one_or_none()


@router.get("/status", response_model=SocialStatusResponse)
async def social_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ig = await _get_social_account(db, current_user.id, "instagram")
    yt = await _get_social_account(db, current_user.id, "youtube")
    return SocialStatusResponse(
        instagram={
            "connected": bool(ig and ig.access_token),
            "username": ig.platform_username if ig else None,
            "user_id": ig.platform_user_id if ig else None,
        },
        youtube={
            "connected": bool(yt and yt.access_token),
            "channel_id": yt.platform_channel_id if yt else None,
        },
    )


@router.delete("/instagram/disconnect")
async def instagram_disconnect(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ig = await _get_social_account(db, current_user.id, "instagram")
    if ig:
        await db.delete(ig)
        await db.flush()
    return {"disconnected": True}


@router.delete("/youtube/disconnect")
async def youtube_disconnect(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    yt = await _get_social_account(db, current_user.id, "youtube")
    if yt:
        await db.delete(yt)
        await db.flush()
    return {"disconnected": True}


# ─── Instagram OAuth ───────────────────────────────────────────────────────────

@router.get("/instagram/connect")
async def instagram_connect(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    current_user = await get_current_user_from_token(token, db)
    scope = "instagram_basic,instagram_content_publish,pages_read_engagement"
    state = str(current_user.id)
    redirect_uri = f"{settings.BACKEND_URL}/api/v1/social/instagram/callback"
    url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={settings.INSTAGRAM_APP_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&response_type=code"
        f"&state={state}"
    )
    return RedirectResponse(url)


@router.get("/instagram/callback")
async def instagram_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    # Resolve user from state (user_id passed in connect)
    try:
        user_id = uuid.UUID(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    redirect_uri = f"{settings.BACKEND_URL}/api/v1/social/instagram/callback"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            data={
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        resp.raise_for_status()
        token_data = resp.json()
        access_token = token_data["access_token"]

        # Exchange short-lived for long-lived token (60-day)
        ll_resp = await client.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "access_token": access_token,
            },
        )
        if ll_resp.status_code == 200:
            access_token = ll_resp.json().get("access_token", access_token)

        me_resp = await client.get(
            "https://graph.instagram.com/me",
            params={"fields": "id,username", "access_token": access_token},
        )
        me_data = me_resp.json()

    # Upsert social_account row
    acct = await _get_social_account(db, user.id, "instagram")
    if not acct:
        acct = SocialAccount(user_id=user.id, platform="instagram")
        db.add(acct)

    acct.access_token = encrypt_token(access_token)
    acct.platform_user_id = me_data.get("id")
    acct.platform_username = me_data.get("username")
    await db.flush()

    # Redirect back to frontend with success
    return HTMLResponse(
        content="""<html><body><script>
            window.opener && window.opener.postMessage({type:'ig_connected',username:'"""
        + (me_data.get("username") or "")
        + """'}, '*');
            window.close();
        </script><p>Instagram connected! You can close this window.</p></body></html>"""
    )


@router.post("/instagram/publish")
async def instagram_publish(
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acct = await _get_social_account(db, current_user.id, "instagram")
    if not acct or not acct.access_token:
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

    try:
        access_token = decrypt_token(acct.access_token)
        full_caption = body.caption + "\n" + " ".join(body.hashtags)

        async with httpx.AsyncClient(timeout=60) as client:
            container_resp = await client.post(
                f"https://graph.instagram.com/v18.0/{acct.platform_user_id}/media",
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

            publish_resp = await client.post(
                f"https://graph.instagram.com/v18.0/{acct.platform_user_id}/media_publish",
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
async def youtube_connect(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    current_user = await get_current_user_from_token(token, db)
    state = str(current_user.id)
    redirect_uri = f"{settings.BACKEND_URL}/api/v1/social/youtube/callback"
    scope = "https://www.googleapis.com/auth/youtube.upload"
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.YOUTUBE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&response_type=code"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return RedirectResponse(url)


@router.get("/youtube/callback")
async def youtube_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        user_id = uuid.UUID(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    redirect_uri = f"{settings.BACKEND_URL}/api/v1/social/youtube/callback"

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_resp.json()

        # Fetch channel info
        channel_resp = await client.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "id,snippet", "mine": "true"},
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        channel_data = channel_resp.json()
        channel_id = None
        channel_name = None
        if channel_data.get("items"):
            ch = channel_data["items"][0]
            channel_id = ch["id"]
            channel_name = ch["snippet"]["title"]

    acct = await _get_social_account(db, user.id, "youtube")
    if not acct:
        acct = SocialAccount(user_id=user.id, platform="youtube")
        db.add(acct)

    acct.access_token = encrypt_token(token_data["access_token"])
    acct.refresh_token = encrypt_token(token_data.get("refresh_token", ""))
    acct.platform_channel_id = channel_id
    acct.platform_username = channel_name
    await db.flush()

    return HTMLResponse(
        content="""<html><body><script>
            window.opener && window.opener.postMessage({type:'yt_connected',channel:'"""
        + (channel_name or "")
        + """'}, '*');
            window.close();
        </script><p>YouTube connected! You can close this window.</p></body></html>"""
    )


@router.post("/youtube/publish")
async def youtube_publish(
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acct = await _get_social_account(db, current_user.id, "youtube")
    if not acct or not acct.access_token:
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
