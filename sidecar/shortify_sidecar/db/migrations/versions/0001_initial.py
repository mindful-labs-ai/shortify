"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-26 00:00:00
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pdfs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("local_path", sa.String(), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("toc_json", sa.JSON(), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("sha256", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_pdfs_created", "pdfs", ["created_at"])
    op.create_index(
        "idx_pdfs_active", "pdfs", ["deleted_at"],
        sqlite_where=sa.text("deleted_at IS NULL"),
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "image_concepts",
        sa.Column("slug", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("preview_path", sa.String(), nullable=False),
        sa.Column("image_style_preset", sa.String(), nullable=False),
        sa.Column("reference_image_paths", sa.JSON(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("pdf_id", sa.String(), sa.ForeignKey("pdfs.id"), nullable=False),
        sa.Column("toc_section_index", sa.Integer(), nullable=False),
        sa.Column("toc_section_title", sa.String(), nullable=False),
        sa.Column("image_concept_slug", sa.String(), sa.ForeignKey("image_concepts.slug"), nullable=True),
        sa.Column("stage", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stage_message", sa.String(), nullable=True),
        sa.Column("conceptized_json", sa.JSON(), nullable=True),
        sa.Column("output_video_path", sa.String(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("error", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_jobs_pdf", "jobs", ["pdf_id"])
    op.create_index("idx_jobs_stage", "jobs", ["stage"])
    op.create_index("idx_jobs_created", "jobs", ["created_at"])
    op.create_index(
        "idx_jobs_active", "jobs", ["deleted_at"],
        sqlite_where=sa.text("deleted_at IS NULL"),
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.create_table(
        "job_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("job_id", sa.String(), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("stage", sa.Integer(), nullable=False),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_job_events_job", "job_events", ["job_id", "created_at"])

    op.create_table(
        "queue_tasks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("task_type", sa.String(), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.String(), nullable=True),
        sa.Column("worker_id", sa.String(), nullable=True),
    )
    op.create_index("idx_queue_status_sched", "queue_tasks", ["status", "scheduled_at"])

    op.create_table(
        "app_meta",
        sa.Column("k", sa.String(), primary_key=True),
        sa.Column("v", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("app_meta")
    op.drop_table("queue_tasks")
    op.drop_table("job_events")
    op.drop_table("jobs")
    op.drop_table("image_concepts")
    op.drop_table("pdfs")
