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
    state = str(current_user.id)
    redirect_uri = f"{settings.BACKEND_URL}/api/v1/social/instagram/callback"
    scope = "instagram_business_basic,instagram_business_content_publish"
    url = (
        f"https://www.instagram.com/oauth/authorize"
        f"?client_id={settings.INSTAGRAM_APP_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&state={state}"
    )
    print(f"[IG CONNECT] authorize url: {url}")
    return RedirectResponse(url)


@router.get("/instagram/callback")
async def instagram_callback(
    request: Request,
    code: str,
    db: AsyncSession = Depends(get_db),
    state: str | None = None,
):
    if not state:
        return HTMLResponse(
            content="<html><body><p>Missing state. Please connect Instagram from the ReelCraft app.</p></body></html>",
            status_code=400,
        )
    try:
        user_id = uuid.UUID(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    redirect_uri = f"{settings.BACKEND_URL}/api/v1/social/instagram/callback"
    print(f"[IG CALLBACK] redirect_uri={redirect_uri!r} client_id={settings.INSTAGRAM_APP_ID!r}")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        print(f"[IG TOKEN] status={resp.status_code} body={resp.text!r}")
        if resp.status_code != 200:
            error_detail = resp.text
            return HTMLResponse(
                content=f"<html><body><p>Instagram token exchange failed: {error_detail}</p><p>Please close this window and try connecting again.</p></body></html>",
                status_code=400,
            )
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
        me_data = me_resp.json()

    # Upsert social_account row
    acct = await _get_social_account(db, user.id, "instagram")
    if not acct:
        acct = SocialAccount(user_id=user.id, platform="instagram")
        db.add(acct)

    acct.access_token = encrypt_token(access_token)
    acct.platform_user_id = me_data.get("id")
    acct.platform_username = me_data.get("username")
    # Auto-populate instagram_handle on user if not already set
    if me_data.get("username") and not user.instagram_handle:
        user.instagram_handle = me_data.get("username")
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


@router.post("/instagram/publish", status_code=202)
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

    pj = PublishJob(
        project_id=project.id,
        user_id=current_user.id,
        platform="instagram",
        status="queued",
        caption=body.caption,
        hashtags=body.hashtags,
    )
    db.add(pj)
    await db.flush()

    import redis as sync_redis, rq
    redis_conn = sync_redis.Redis.from_url(settings.REDIS_URL)
    queue = rq.Queue("default", connection=redis_conn)
    queue.enqueue(
        "app.workers.publish_worker.publish_job",
        publish_job_id=str(pj.id),
        job_timeout=300,
    )
    return {"publish_job_id": str(pj.id), "status": "queued"}


@router.get("/publish/{publish_job_id}")
async def get_publish_status(
    publish_job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PublishJob).where(
            and_(PublishJob.id == publish_job_id, PublishJob.user_id == current_user.id)
        )
    )
    pj = result.scalar_one_or_none()
    if not pj:
        raise HTTPException(status_code=404, detail="Publish job not found")
    return {
        "id": str(pj.id),
        "platform": pj.platform,
        "status": pj.status,
        "error_message": pj.error_message,
        "platform_post_id": pj.platform_post_id,
        "published_at": pj.published_at,
        "retry_count": pj.retry_count,
    }


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


async def _refresh_youtube_token(acct: SocialAccount, db: AsyncSession) -> str:
    """Return valid access token, refreshing if needed."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "refresh_token": decrypt_token(acct.refresh_token),
                "grant_type": "refresh_token",
            },
        )
        data = resp.json()
        if "access_token" not in data:
            raise Exception(f"YouTube token refresh failed: {data}")
        new_token = data["access_token"]
        acct.access_token = encrypt_token(new_token)
        await db.flush()
        return new_token


@router.post("/youtube/publish", status_code=202)
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

    pj = PublishJob(
        project_id=project.id,
        user_id=current_user.id,
        platform="youtube",
        status="queued",
        caption=body.caption,
        hashtags=body.hashtags,
    )
    db.add(pj)
    await db.flush()

    import redis as sync_redis, rq
    redis_conn = sync_redis.Redis.from_url(settings.REDIS_URL)
    queue = rq.Queue("default", connection=redis_conn)
    queue.enqueue(
        "app.workers.publish_worker.publish_job",
        publish_job_id=str(pj.id),
        job_timeout=300,
    )
    return {"publish_job_id": str(pj.id), "status": "queued"}
