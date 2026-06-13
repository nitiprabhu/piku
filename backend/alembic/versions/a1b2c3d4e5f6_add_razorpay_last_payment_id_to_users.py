"""add razorpay_last_payment_id to users

Revision ID: a1b2c3d4e5f6
Revises: 583df7238d9b
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '583df7238d9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_last_payment_id VARCHAR(100)")


def downgrade() -> None:
    op.drop_column('users', 'razorpay_last_payment_id')
