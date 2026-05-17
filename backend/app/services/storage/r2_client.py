import boto3
from botocore.config import Config
from app.config import settings


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


async def upload_to_r2(local_path: str, r2_key: str) -> str:
    """Upload file to Cloudflare R2 and return public CDN URL. Falls back to local static serving on failure."""
    import asyncio
    import os
    import shutil
    from pathlib import Path

    # If R2 is not fully configured, trigger fallback immediately
    is_unconfigured = (
        not settings.R2_ACCOUNT_ID
        or not settings.R2_ACCESS_KEY_ID
        or not settings.R2_SECRET_ACCESS_KEY
        or settings.R2_ACCESS_KEY_ID in ("", "...", "sk-...")
    )
    if is_unconfigured:
        print(f"⚠️ Cloudflare R2 not configured. Falling back to local static file serving for {r2_key}")
        dest_path = Path("app/static") / r2_key
        os.makedirs(dest_path.parent, exist_ok=True)
        shutil.copy2(local_path, dest_path)
        return f"{settings.BACKEND_URL}/static/{r2_key}"

    try:
        client = get_r2_client()
        content_type = "video/mp4" if r2_key.endswith(".mp4") else "image/jpeg"

        def _upload():
            with open(local_path, "rb") as f:
                client.put_object(
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=r2_key,
                    Body=f,
                    ContentType=content_type,
                    CacheControl="public, max-age=31536000",
                )

        # Run blocking boto3 call in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _upload)

        return f"{settings.R2_PUBLIC_URL}/{r2_key}"
    except Exception as e:
        print(f"⚠️ R2 Upload failed: {e}. Falling back to local static file serving for {r2_key}")
        dest_path = Path("app/static") / r2_key
        os.makedirs(dest_path.parent, exist_ok=True)
        shutil.copy2(local_path, dest_path)
        return f"{settings.BACKEND_URL}/static/{r2_key}"

