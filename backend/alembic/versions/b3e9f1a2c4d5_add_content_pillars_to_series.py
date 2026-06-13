"""add content_pillars to series

Revision ID: b3e9f1a2c4d5
Revises: 583df7238d9b
Create Date: 2026-06-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b3e9f1a2c4d5'
down_revision: Union[str, None] = 'f47a5b8c6e2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE series ADD COLUMN IF NOT EXISTS content_pillars JSONB")


def downgrade() -> None:
    op.drop_column('series', 'content_pillars')
