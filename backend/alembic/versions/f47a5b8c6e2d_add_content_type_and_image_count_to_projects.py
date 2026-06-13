"""Add content_type and image_count columns to projects table.

Revision ID: f47a5b8c6e2d
Revises: 583df7238d9b
Create Date: 2026-06-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "f47a5b8c6e2d"
down_revision = ("583df7238d9b", "a1b2c3d4e5f6")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) NOT NULL DEFAULT 'video'")
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_count INTEGER NOT NULL DEFAULT 1")


def downgrade() -> None:
    op.drop_column("projects", "image_count")
    op.drop_column("projects", "content_type")
