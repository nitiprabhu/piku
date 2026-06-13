"""add missing tables and columns (idempotent)

Revision ID: 9c83e51af792
Revises: 001
Create Date: 2026-05-29 19:02:19.609831

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '9c83e51af792'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Missing columns on existing tables (all idempotent) ──────────────────

    op.execute("""
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS videos_generated INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS first_video_purchased BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100),
            ADD COLUMN IF NOT EXISTS youtube_handle VARCHAR(100),
            ADD COLUMN IF NOT EXISTS show_social_overlay BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS razorpay_last_payment_id VARCHAR(100)
    """)

    op.execute("""
        ALTER TABLE projects
            ADD COLUMN IF NOT EXISTS caption_mode VARCHAR(20) NOT NULL DEFAULT 'full_sentence',
            ADD COLUMN IF NOT EXISTS view_count INTEGER,
            ADD COLUMN IF NOT EXISTS like_count INTEGER,
            ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) NOT NULL DEFAULT 'video',
            ADD COLUMN IF NOT EXISTS image_count INTEGER NOT NULL DEFAULT 1
    """)

    op.execute("""
        ALTER TABLE publish_jobs
            ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0
    """)

    op.execute("""
        ALTER TABLE templates
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS template_type VARCHAR(20) NOT NULL DEFAULT 'regular'
    """)

    # ── social_accounts ───────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS social_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            platform VARCHAR(20) NOT NULL,
            platform_user_id VARCHAR(200),
            access_token TEXT,
            refresh_token TEXT,
            token_expiry TIMESTAMP WITH TIME ZONE,
            channel_id VARCHAR(200),
            handle VARCHAR(200),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id, platform)
        )
    """)

    # ── series ────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS series (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(200) NOT NULL,
            topic TEXT NOT NULL,
            style VARCHAR(50) NOT NULL DEFAULT 'storytelling',
            language VARCHAR(20) NOT NULL DEFAULT 'hi',
            voice_id VARCHAR(50) NOT NULL DEFAULT 'rohit_m',
            duration_target INTEGER NOT NULL DEFAULT 60,
            episode_count INTEGER NOT NULL DEFAULT 0,
            is_deleted BOOLEAN NOT NULL DEFAULT false,
            content_pillars JSONB,
            is_serialized BOOLEAN NOT NULL DEFAULT true,
            series_type VARCHAR(50) NOT NULL DEFAULT 'regular',
            character_profile JSONB,
            schedule_type VARCHAR(20) NOT NULL DEFAULT 'manual',
            schedule_time VARCHAR(5) NOT NULL DEFAULT '09:00',
            next_run_at TIMESTAMP WITH TIME ZONE,
            last_run_at TIMESTAMP WITH TIME ZONE,
            caption_mode VARCHAR(20) NOT NULL DEFAULT 'full_sentence',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_series_user_id ON series(user_id)")

    # Ensure all series columns exist (table may have been created by init_db without some columns)
    op.execute("""
        ALTER TABLE series
            ADD COLUMN IF NOT EXISTS is_serialized BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS series_type VARCHAR(50) NOT NULL DEFAULT 'regular',
            ADD COLUMN IF NOT EXISTS character_profile JSONB,
            ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(20) NOT NULL DEFAULT 'manual',
            ADD COLUMN IF NOT EXISTS schedule_time VARCHAR(5) NOT NULL DEFAULT '09:00',
            ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS caption_mode VARCHAR(20) NOT NULL DEFAULT 'full_sentence',
            ADD COLUMN IF NOT EXISTS content_pillars JSONB,
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false
    """)

    # ── series_episodes ───────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS series_episodes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id),
            episode_number INTEGER NOT NULL,
            generated_prompt TEXT NOT NULL,
            project_id UUID REFERENCES projects(id),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(series_id, episode_number)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_series_episodes_series_id ON series_episodes(series_id)")

    # ── inspiration_videos ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS inspiration_videos (
            id VARCHAR(100) PRIMARY KEY,
            title VARCHAR(300),
            category VARCHAR(50),
            language VARCHAR(20),
            sort_order INTEGER DEFAULT 0,
            prompt TEXT
        )
    """)

    # ── marketplace tables ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS marketplace_briefs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            brand_name VARCHAR(200) NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            title VARCHAR(300) NOT NULL,
            description TEXT,
            budget_min INTEGER,
            budget_max INTEGER,
            category VARCHAR(50),
            language VARCHAR(20),
            deliverables JSONB,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS marketplace_creator_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            bio TEXT,
            niches JSONB,
            languages JSONB,
            rate_per_reel INTEGER,
            portfolio_urls JSONB,
            is_available BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS marketplace_deals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            brief_id UUID NOT NULL REFERENCES marketplace_briefs(id) ON DELETE CASCADE,
            creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            agreed_rate INTEGER,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
    """)


def downgrade() -> None:
    pass
