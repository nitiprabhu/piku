from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache

_DEFAULT_SECRET = "change-me-to-a-random-32-char-string"


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = _DEFAULT_SECRET

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_set(cls, v: str, info) -> str:
        import os
        env = os.getenv("APP_ENV", "development")
        if env != "development" and v == _DEFAULT_SECRET:
            raise ValueError(
                "SECRET_KEY must be set to a random value in non-development environments"
            )
        return v
    FRONTEND_URL: str = "http://localhost:3001"
    BACKEND_URL: str = "http://localhost:8005"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://reelcraft:password@postgres:5432/reelcraft"
    SYNC_DATABASE_URL: str = "postgresql://reelcraft:password@postgres:5432/reelcraft"
    REDIS_URL: str = "redis://redis:6379/0"

    # AI APIs
    OPENAI_API_KEY: str = ""

    # Video provider: auto | muapi | kling | falai
    # auto = cheapest viable model per plan (WAN1.3B free, Kling std paid)
    VIDEO_PROVIDER: str = "auto"
    MUAPI_API_KEY: str = ""
    KLING_ACCESS_KEY_ID: str = ""
    KLING_ACCESS_KEY_SECRET: str = ""
    FALAI_API_KEY: str = ""

    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "reelcraft-media"
    R2_PUBLIC_URL: str = ""

    # Social APIs
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    INSTAGRAM_PARENT_APP_ID: str = ""
    YOUTUBE_CLIENT_ID: str = ""
    YOUTUBE_CLIENT_SECRET: str = ""

    # Payments
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # SMS/OTP (MSG91)
    MSG91_AUTH_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""
    MSG91_SENDER_ID: str = "RCRAFT"

    # Tokens
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
