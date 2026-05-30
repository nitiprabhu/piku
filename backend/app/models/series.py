import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, TIMESTAMP, func, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Series(Base):
    __tablename__ = "series"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    style: Mapped[str] = mapped_column(String(50), default="storytelling")
    language: Mapped[str] = mapped_column(String(20), default="hi")
    voice_id: Mapped[str] = mapped_column(String(50), default="rohit_m")
    duration_target: Mapped[int] = mapped_column(Integer, default=60)
    episode_count: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    # Content Universe: auto-derived pillars for viral standalone episode generation
    content_pillars: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    is_serialized: Mapped[bool] = mapped_column(Boolean, default=True)
    series_type: Mapped[str] = mapped_column(String(50), default="regular", server_default="regular")
    character_profile: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # P1: Auto-scheduling
    schedule_type: Mapped[str] = mapped_column(String(20), default="manual")  # manual | daily | every_3_days | weekly
    schedule_time: Mapped[str] = mapped_column(String(5), default="09:00")    # HH:MM UTC
    next_run_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_run_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    # P4: Caption style
    caption_mode: Mapped[str] = mapped_column(String(20), default="full_sentence")  # full_sentence | keyword_pop
    enable_captions: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SeriesEpisode(Base):
    __tablename__ = "series_episodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("series.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="pending")

    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("series_id", "episode_number", name="uq_series_episode"),)
