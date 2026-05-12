import uuid
from sqlalchemy import String, Integer, Text, Boolean, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")  # free | pro | business
    credits: Mapped[int] = mapped_column(Integer, default=5)
    language_pref: Mapped[str] = mapped_column(String(10), default="hi")
    category_pref: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Social tokens (stored encrypted)
    ig_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    ig_user_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    yt_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    yt_refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    yt_channel_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Payments
    razorpay_sub_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )
