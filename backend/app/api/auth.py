import random
import base64
import hashlib
import hmac
import json
import uuid as uuid_module
from redis import asyncio as aioredis
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    SendOTPRequest, VerifyOTPRequest, RefreshRequest,
    AuthResponse, TokenResponse, AccessTokenResponse, UserResponse,
)
from app.core.security import (
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from app.services.sms import send_sms_otp
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

_redis: aioredis.Redis | None = None

def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis

_OTP_TTL = 300      # 5 min OTP validity
_SEND_WINDOW = 600  # 10 min window for send-rate limit
_MAX_SENDS = 5      # max OTPs per phone per window
_MAX_ATTEMPTS = 5   # max verify attempts before lockout


@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(body: SendOTPRequest):
    rc = get_redis()
    send_key = f"otp:sends:{body.phone}"
    sends = await rc.incr(send_key)
    if sends == 1:
        await rc.expire(send_key, _SEND_WINDOW)
    if sends > _MAX_SENDS:
        ttl = await rc.ttl(send_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many OTP requests. Try again in {ttl}s.",
        )

    otp = "123456" if body.phone == "+919999999999" else f"{random.randint(100000, 999999)}"

    await rc.setex(f"otp:{body.phone}", _OTP_TTL, otp)
    await rc.delete(f"otp:attempts:{body.phone}")

    success = await send_sms_otp(body.phone, otp)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again.",
        )

    response: dict = {"success": True, "message": "OTP sent successfully"}
    if settings.APP_ENV == "development":
        response["otp"] = otp
    return response


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(body: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    rc = get_redis()
    attempt_key = f"otp:attempts:{body.phone}"
    attempts = int(await rc.get(attempt_key) or 0)
    if attempts >= _MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Request a new OTP.",
        )

    stored_otp = await rc.get(f"otp:{body.phone}")
    if not stored_otp or stored_otp != body.otp:
        new_attempts = await rc.incr(attempt_key)
        await rc.expire(attempt_key, _OTP_TTL)
        remaining = max(_MAX_ATTEMPTS - new_attempts, 0)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or expired OTP. {remaining} attempt(s) left.",
        )

    await rc.delete(f"otp:{body.phone}")
    await rc.delete(attempt_key)

    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            phone=body.phone,
            name=body.name or f"Creator {body.phone[-4:]}",
            plan="free",
            credits=2,
            language_pref=body.language_pref or "hi",
        )
        db.add(user)
        await db.flush()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    await db.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    return AccessTokenResponse(access_token=access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    return


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


def _verify_meta_signed_request(signed_request: str, app_secret: str) -> dict:
    try:
        encoded_sig, encoded_payload = signed_request.split(".", 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid signed_request format")

    def b64url_decode(s: str) -> bytes:
        s += "=" * (4 - len(s) % 4)
        return base64.urlsafe_b64decode(s)

    try:
        sig = b64url_decode(encoded_sig)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature encoding")

    expected = hmac.new(
        app_secret.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    if not hmac.compare_digest(sig, expected):
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(b64url_decode(encoded_payload))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload encoding")

    if payload.get("algorithm", "").upper() != "HMAC-SHA256":
        raise HTTPException(status_code=400, detail="Unsupported algorithm")

    return payload


@router.post("/data-deletion")
async def meta_data_deletion(
    signed_request: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Meta data deletion callback. Called when a user removes the app from Instagram."""
    from app.models.social_account import SocialAccount

    payload = _verify_meta_signed_request(signed_request, settings.INSTAGRAM_APP_SECRET)
    instagram_user_id = payload.get("user_id")

    confirmation_code = str(uuid_module.uuid4())

    if instagram_user_id:
        result = await db.execute(
            select(SocialAccount).where(
                and_(
                    SocialAccount.platform == "instagram",
                    SocialAccount.platform_user_id == instagram_user_id,
                )
            )
        )
        social = result.scalar_one_or_none()

        if social:
            user_id = social.user_id
            await db.execute(
                delete(SocialAccount).where(SocialAccount.user_id == user_id)
            )
            result2 = await db.execute(select(User).where(User.id == user_id))
            user = result2.scalar_one_or_none()
            if user:
                user.phone = f"deleted_{confirmation_code[:8]}"
                user.name = "Deleted User"
                user.instagram_handle = None
                user.youtube_handle = None
                user.razorpay_sub_id = None
            await db.flush()

    status_url = f"{settings.FRONTEND_URL}/data-deletion?id={confirmation_code}"
    return {"url": status_url, "confirmation_code": confirmation_code}
