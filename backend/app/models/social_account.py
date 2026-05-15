import uuid
from sqlalchemy import String, Text, TIMESTAMP, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"
    __table_args__ = (
        UniqueConstraint("user_id", "platform", name="uq_user_platform"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)  # instagram | youtube

    # Encrypted tokens
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Platform account identifiers
    platform_user_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    platform_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    platform_channel_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Token expiry (YouTube tokens expire)
    token_expires_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="social_accounts")
