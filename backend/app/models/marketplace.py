import uuid
from sqlalchemy import (
    String, Integer, Text, Float, Boolean, ForeignKey,
    TIMESTAMP, func, CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from app.database import Base


class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    niches: Mapped[list | None] = mapped_column(ARRAY(Text), nullable=True)
    languages: Mapped[list | None] = mapped_column(ARRAY(Text), nullable=True)
    rate_per_reel: Mapped[int | None] = mapped_column(Integer, nullable=True)  # paise
    portfolio_urls: Mapped[list | None] = mapped_column(ARRAY(Text), nullable=True)
    instagram_handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    youtube_handle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    follower_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avg_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_deals: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", foreign_keys=[user_id])


class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_briefs_posted: Mapped[int] = mapped_column(Integer, default=0)
    total_spend: Mapped[int] = mapped_column(Integer, default=0)  # paise
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", foreign_keys=[user_id])


class Brief(Base):
    __tablename__ = "briefs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    niches: Mapped[list | None] = mapped_column(ARRAY(Text), nullable=True)
    languages: Mapped[list | None] = mapped_column(ARRAY(Text), nullable=True)
    num_reels: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_per_reel: Mapped[int] = mapped_column(Integer, nullable=False)  # paise
    timeline_days: Mapped[int] = mapped_column(Integer, nullable=False)
    requirements: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # status: open | closed | paused
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    deal_requests = relationship("DealRequest", back_populates="brief")
    deals = relationship("Deal", back_populates="brief")


class DealRequest(Base):
    """Creator applies to a brief, or brand invites a creator."""
    __tablename__ = "deal_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brief_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("briefs.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    creator_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    initiated_by: Mapped[str] = mapped_column(String(10), nullable=False)  # creator | brand
    # status: pending | accepted | rejected | negotiating | withdrawn
    status: Mapped[str] = mapped_column(String(20), default="pending")
    proposed_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)  # paise, for negotiate
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    brief = relationship("Brief", back_populates="deal_requests")


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brief_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("briefs.id"), nullable=False, index=True,
    )
    creator_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True,
    )
    brand_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True,
    )
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # paise
    num_reels: Mapped[int] = mapped_column(Integer, nullable=False)
    delivered_reels: Mapped[int] = mapped_column(Integer, default=0)
    # status: in_progress | review | completed | disputed | cancelled
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    deadline: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    # Razorpay escrow
    razorpay_upfront_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    razorpay_final_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    upfront_paid_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    final_paid_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    brief = relationship("Brief", back_populates="deals")
    creator = relationship("User", foreign_keys=[creator_user_id])
    brand = relationship("User", foreign_keys=[brand_user_id])
    messages = relationship("DealMessage", back_populates="deal",
                            order_by="DealMessage.created_at")
    deliverables = relationship("DealDeliverable", back_populates="deal")


class DealMessage(Base):
    __tablename__ = "deal_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    sender_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    deal = relationship("Deal", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_user_id])


class DealDeliverable(Base):
    __tablename__ = "deal_deliverables"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True,
    )
    # status: submitted | approved | revision_requested
    status: Mapped[str] = mapped_column(String(30), default="submitted")
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    reviewed_at: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    deal = relationship("Deal", back_populates="deliverables")
    project = relationship("Project", foreign_keys=[project_id])
