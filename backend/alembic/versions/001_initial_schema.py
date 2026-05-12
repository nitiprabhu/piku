"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("plan", sa.String(20), server_default="free"),
        sa.Column("credits", sa.Integer, server_default="5"),
        sa.Column("language_pref", sa.String(10), server_default="hi"),
        sa.Column("category_pref", sa.String(50), nullable=True),
        sa.Column("ig_access_token", sa.Text, nullable=True),
        sa.Column("ig_user_id", sa.String(100), nullable=True),
        sa.Column("yt_access_token", sa.Text, nullable=True),
        sa.Column("yt_refresh_token", sa.Text, nullable=True),
        sa.Column("yt_channel_id", sa.String(100), nullable=True),
        sa.Column("razorpay_sub_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("input_prompt", sa.Text, nullable=False),
        sa.Column("language", sa.String(20), server_default="hi"),
        sa.Column("style", sa.String(50), nullable=True),
        sa.Column("voice_id", sa.String(50), nullable=True),
        sa.Column("duration_target", sa.Integer, nullable=True),
        sa.Column("template_id", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("job_id", sa.String(100), nullable=True),
        sa.Column("script_json", postgresql.JSONB, nullable=True),
        sa.Column("video_url", sa.Text, nullable=True),
        sa.Column("thumbnail_url", sa.Text, nullable=True),
        sa.Column("duration_actual", sa.Integer, nullable=True),
        sa.Column("file_size_bytes", sa.Integer, nullable=True),
        sa.Column("viral_score", sa.Float, nullable=True),
        sa.Column("caption_text", sa.Text, nullable=True),
        sa.Column("hashtags", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, server_default="0"),
        sa.Column("is_deleted", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_projects_user_status", "projects", ["user_id", "status"])
    op.create_index("idx_projects_user_created", "projects", ["user_id", "created_at"])

    op.create_table(
        "publish_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("caption", sa.Text, nullable=True),
        sa.Column("hashtags", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("platform_post_id", sa.String(200), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("published_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "templates",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("language", sa.String(20), nullable=True),
        sa.Column("prompt_examples", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("style_config", postgresql.JSONB, nullable=True),
        sa.Column("thumbnail_url", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("sort_order", sa.Integer, server_default="0"),
    )

    op.create_table(
        "credit_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("delta", sa.Integer, nullable=False),
        sa.Column("reason", sa.String(100), nullable=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("credit_transactions")
    op.drop_table("templates")
    op.drop_table("publish_jobs")
    op.drop_index("idx_projects_user_created", "projects")
    op.drop_index("idx_projects_user_status", "projects")
    op.drop_table("projects")
    op.drop_table("users")
