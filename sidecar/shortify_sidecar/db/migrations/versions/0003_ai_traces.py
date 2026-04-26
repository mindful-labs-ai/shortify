"""ai_traces table

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-26 18:00:00
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_traces",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("job_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="running"),
        sa.Column("request_preview", sa.Text(), nullable=True),
        sa.Column("request_meta", sa.JSON(), nullable=False),
        sa.Column("response_preview", sa.Text(), nullable=True),
        sa.Column("response_meta", sa.JSON(), nullable=False),
        sa.Column("error", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
    )
    op.create_index("idx_ai_traces_started", "ai_traces", ["started_at"])
    op.create_index("idx_ai_traces_job", "ai_traces", ["job_id", "started_at"])
    op.create_index("idx_ai_traces_kind", "ai_traces", ["kind", "started_at"])


def downgrade() -> None:
    op.drop_index("idx_ai_traces_kind", table_name="ai_traces")
    op.drop_index("idx_ai_traces_job", table_name="ai_traces")
    op.drop_index("idx_ai_traces_started", table_name="ai_traces")
    op.drop_table("ai_traces")
