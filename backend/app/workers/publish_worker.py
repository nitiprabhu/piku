"""
RQ worker for publishing to Instagram and YouTube.
Retries up to 3x on failure with exponential backoff.
"""
import asyncio
import os
import tempfile
import time
import logging

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


def publish_job(publish_job_id: str):
    """RQ entry point — publishes a single PublishJob to its platform."""
    from app.config import settings
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(engine)
    db = Session()

    try:
        from app.models.publish_job import PublishJob
        from app.models.project import Project
        from app.models.social_account import SocialAccount

        job = db.query(PublishJob).filter(PublishJob.id == publish_job_id).first()
        if not job:
            logger.error(f"PublishJob {publish_job_id} not found")
            return

        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project or not project.video_url:
            _fail(job, db, "Project not found or video not ready")
            return

        acct = db.query(SocialAccount).filter(
            SocialAccount.user_id == job.user_id,
            SocialAccount.platform == job.platform,
        ).first()
        if not acct or not acct.access_token:
            _fail(job, db, f"{job.platform.capitalize()} not connected")
            return

        job.status = "processing"
        db.commit()

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                if job.platform == "instagram":
                    _publish_instagram(job, project, acct, db)
                elif job.platform == "youtube":
                    _publish_youtube(job, project, acct, db)
                else:
                    _fail(job, db, f"Unknown platform: {job.platform}")
                    return
                return  # success
            except Exception as e:
                err = str(e)
                logger.warning(f"Publish attempt {attempt}/{MAX_RETRIES} failed for {publish_job_id}: {err}")
                if attempt < MAX_RETRIES:
                    time.sleep(2 ** attempt)  # 2s, 4s backoff
                else:
                    _fail(job, db, err)
    finally:
        db.close()


def _fail(job, db, error: str):
    from datetime import datetime, timezone
    job.status = "failed"
    job.error_message = error[:1000]
    db.commit()
    logger.error(f"PublishJob {job.id} permanently failed: {error}")


def _publish_instagram(job, project, acct, db):
    """Publish to Instagram Reels."""
    import httpx
    from datetime import datetime, timezone
    from app.core.security import decrypt_token, encrypt_token

    access_token = decrypt_token(acct.access_token)

    # Try to refresh IG token (long-lived tokens, refresh if approaching expiry)
    try:
        with httpx.Client(timeout=30) as client:
            refresh_resp = client.get(
                "https://graph.instagram.com/refresh_access_token",
                params={"grant_type": "ig_refresh_token", "access_token": access_token},
            )
            if refresh_resp.status_code == 200:
                new_data = refresh_resp.json()
                if "access_token" in new_data:
                    access_token = new_data["access_token"]
                    acct.access_token = encrypt_token(access_token)
                    db.commit()
    except Exception:
        pass  # Token refresh best-effort

    full_caption = job.caption or ""
    if job.hashtags:
        full_caption += "\n" + " ".join(job.hashtags)

    with httpx.Client(timeout=60) as client:
        container_resp = client.post(
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

        # Poll until FINISHED
        for _ in range(30):
            time.sleep(5)
            status_resp = client.get(
                f"https://graph.instagram.com/v18.0/{container_id}",
                params={"fields": "status_code,status", "access_token": access_token},
            )
            status_data = status_resp.json()
            if status_data.get("status_code") == "FINISHED":
                break
            if status_data.get("status_code") == "ERROR":
                raise Exception(f"IG container error: {status_data}")
        else:
            raise Exception("IG container timed out (150s)")

        publish_resp = client.post(
            f"https://graph.instagram.com/v18.0/{acct.platform_user_id}/media_publish",
            params={"creation_id": container_id, "access_token": access_token},
        )
        publish_data = publish_resp.json()
        if "id" not in publish_data:
            raise Exception(f"IG publish failed: {publish_data}")

    job.status = "published"
    job.platform_post_id = publish_data["id"]
    job.published_at = datetime.now(timezone.utc)
    db.commit()


def _publish_youtube(job, project, acct, db):
    """Publish to YouTube Shorts."""
    import httpx
    from datetime import datetime, timezone
    from app.config import settings
    from app.core.security import decrypt_token, encrypt_token

    # Refresh YouTube token
    with httpx.Client(timeout=30) as client:
        token_resp = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "refresh_token": decrypt_token(acct.refresh_token),
                "grant_type": "refresh_token",
            },
        )
        token_data = token_resp.json()
        if "access_token" not in token_data:
            raise Exception(f"YouTube token refresh failed: {token_data}")
        access_token = token_data["access_token"]
        acct.access_token = encrypt_token(access_token)
        db.commit()

    title = (job.caption or "")[:100]
    if "#shorts" not in title.lower():
        title = title[:93] + " #Shorts"
    hashtag_str = " ".join(job.hashtags or [])
    description = f"{job.caption or ''}\n\n{hashtag_str}\n\n#Shorts"

    with httpx.Client(timeout=120) as client:
        video_resp = client.get(project.video_url)
        if video_resp.status_code != 200:
            raise Exception(f"Failed to download video: {video_resp.status_code}")

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_resp.content)
            tmp_path = tmp.name

        try:
            file_size = os.path.getsize(tmp_path)

            init_resp = client.post(
                "https://www.googleapis.com/upload/youtube/v3/videos",
                params={"uploadType": "resumable", "part": "snippet,status"},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "X-Upload-Content-Type": "video/mp4",
                    "X-Upload-Content-Length": str(file_size),
                },
                json={
                    "snippet": {"title": title, "description": description, "categoryId": "22"},
                    "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
                },
            )
            if init_resp.status_code != 200:
                raise Exception(f"YouTube upload init failed: {init_resp.text}")

            upload_url = init_resp.headers["Location"]
            with open(tmp_path, "rb") as f:
                upload_resp = client.put(
                    upload_url,
                    content=f.read(),
                    headers={"Content-Type": "video/mp4", "Content-Length": str(file_size)},
                )

            upload_data = upload_resp.json()
            if "id" not in upload_data:
                raise Exception(f"YouTube upload failed: {upload_data}")

            video_id = upload_data["id"]
        finally:
            os.unlink(tmp_path)

    job.status = "published"
    job.platform_post_id = video_id
    job.published_at = datetime.now(timezone.utc)
    db.commit()
