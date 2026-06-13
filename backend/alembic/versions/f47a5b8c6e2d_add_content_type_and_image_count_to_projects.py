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
    op.add_column(
        "projects",
        sa.Column(
            "content_type",
            sa.String(length=20),
            server_default="video",
            nullable=False,
        ),
    )
    op.add_column(
        "projects",
        sa.Column(
            "image_count",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("projects", "image_count")
    op.drop_column("projects", "content_type")
