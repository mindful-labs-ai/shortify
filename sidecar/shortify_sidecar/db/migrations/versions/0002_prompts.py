"""prompts table

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-26 12:30:00
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prompts",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("template", sa.Text(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("variables", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("prompts")
