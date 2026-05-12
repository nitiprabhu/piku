import random
import json
import redis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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

# Synchronous redis connection is fast and standard
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(body: SendOTPRequest):
    # For testing, we can use a fixed OTP like 123456 on a specific test phone,
    # or generate a random 6-digit number.
    if body.phone == "+919999999999":
        otp = "123456"
    else:
        otp = f"{random.randint(100000, 999999)}"

    # Save OTP to Redis with a 5-minute (300 seconds) expiration
    redis_client.setex(f"otp:{body.phone}", 300, otp)

    # Deliver via SMS service (either actual SMS or console logging)
    success = await send_sms_otp(body.phone, otp)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send SMS OTP. Please try again."
        )

    response = {"success": True, "message": "OTP sent successfully"}
    
    # Return OTP in response in dev mode to make manual/e2e testing effortless
    if settings.APP_ENV == "development":
        response["otp"] = otp

    return response


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(body: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    # Retrieve stored OTP from Redis
    stored_otp = redis_client.get(f"otp:{body.phone}")

    if not stored_otp or stored_otp != body.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    # Clean up OTP so it can't be reused
    redis_client.delete(f"otp:{body.phone}")

    # Check if user already exists
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    # Register user on-the-fly if they don't exist yet (frictionless auth!)
    if not user:
        user = User(
            phone=body.phone,
            name=body.name or f"Creator {body.phone[-4:]}",
            plan="free",
            credits=5,
            language_pref=body.language_pref or "hi",
        )
        db.add(user)
        await db.flush()  # gets user.id populated

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
    # Stateless JWT. Cleared on client side.
    return


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
