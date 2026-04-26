"""SQLModel 정의 — sqlmodel + SQLAlchemy 2.x.

Soft delete: ``deleted_at`` 컬럼이 ``None`` 이면 활성, ISO 시각이면 휴지통.
PG 이전 호환: raw SQL/SQLite-only 기능 사용 안 함, datetime은 Python 측에서 default 주입.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Index, Text
from sqlmodel import Column, Field, JSON, SQLModel


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Pdf(SQLModel, table=True):
    __tablename__ = "pdfs"

    id: str = Field(primary_key=True)  # ULID
    filename: str
    local_path: str  # pdfs/<id>.pdf (storage_uri로 추후 추상화 가능)
    page_count: Optional[int] = None
    toc_json: Optional[list] = Field(default=None, sa_column=Column(JSON))
    size_bytes: Optional[int] = None
    sha256: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = None

    __table_args__ = (
        Index("idx_pdfs_created", "created_at"),
        Index(
            "idx_pdfs_active",
            "deleted_at",
            sqlite_where="deleted_at IS NULL",
            postgresql_where=None,
        ),
    )


class ImageConcept(SQLModel, table=True):
    __tablename__ = "image_concepts"

    slug: str = Field(primary_key=True)  # diagram_whiteboard 등
    name: str
    description: Optional[str] = None
    preview_path: str  # assets/image_concepts/<slug>/preview.png
    image_style_preset: str  # Imagen 프롬프트 머리말
    reference_image_paths: Optional[list] = Field(default=None, sa_column=Column(JSON))
    active: bool = True
    sort_order: int = 0


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    id: str = Field(primary_key=True)  # ULID
    pdf_id: str = Field(foreign_key="pdfs.id")
    toc_section_index: int
    toc_section_title: str
    image_concept_slug: Optional[str] = Field(
        default=None, foreign_key="image_concepts.slug"
    )

    stage: int = 0  # 0..9, -1 (failed)
    stage_message: Optional[str] = None
    conceptized_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    output_video_path: Optional[str] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = None

    __table_args__ = (
        Index("idx_jobs_pdf", "pdf_id"),
        Index("idx_jobs_stage", "stage"),
        Index("idx_jobs_created", "created_at"),
        Index(
            "idx_jobs_active",
            "deleted_at",
            sqlite_where="deleted_at IS NULL",
        ),
    )


class JobEvent(SQLModel, table=True):
    __tablename__ = "job_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: str = Field(foreign_key="jobs.id")
    stage: int
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)

    __table_args__ = (Index("idx_job_events_job", "job_id", "created_at"),)


class QueueTask(SQLModel, table=True):
    __tablename__ = "queue_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    task_type: str  # extract_toc | conceptize | generate_video
    payload_json: dict = Field(sa_column=Column(JSON))
    status: str = "pending"  # pending | running | done | failed
    attempts: int = 0
    max_attempts: int = 3
    scheduled_at: datetime = Field(default_factory=_utcnow)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    worker_id: Optional[str] = None

    __table_args__ = (Index("idx_queue_status_sched", "status", "scheduled_at"),)


class AppMeta(SQLModel, table=True):
    __tablename__ = "app_meta"

    k: str = Field(primary_key=True)
    v: Optional[str] = None


class Prompt(SQLModel, table=True):
    """LLM 프롬프트 템플릿. 변수 치환 패턴은 ``${VAR}$``.

    같은 key 가 있으면 사용자가 SQL 로 직접 ``UPDATE`` 해서 수정 가능.
    seed 는 idempotent — 기존 row 를 덮어쓰지 않는다.
    """

    __tablename__ = "prompts"

    key: str = Field(primary_key=True)
    template: str
    description: Optional[str] = None
    variables: Optional[list] = Field(default=None, sa_column=Column(JSON))
    updated_at: datetime = Field(default_factory=_utcnow)


class AiTrace(SQLModel, table=True):
    """모든 외부 AI 호출(Gemini 등) 1건당 1행. 무엇을 보냈고 무엇을 받았는지 기록.

    - ``kind``: ``text_json`` | ``pdf_toc`` | ``text`` | ``image`` | ``i2v`` | ``tts`` | ``align``
    - ``status``: ``running`` (insert 시점) → ``done`` 또는 ``failed`` (응답 시점)
    - ``request_preview`` / ``response_preview``: 처음 ~2000자만, 이후 truncated 표시
    - ``request_meta`` / ``response_meta``: 파일 경로, 사이즈, voice, duration_sec 등 구조화된 부가정보
    - ``job_id``: ContextVar 로 worker 가 주입. PDF TOC 등 job 이전 단계는 None
    """

    __tablename__ = "ai_traces"

    id: Optional[int] = Field(default=None, primary_key=True)
    kind: str
    model: str
    job_id: Optional[str] = None  # FK 미지정 (PDF TOC 등 job 이전 호출 허용)
    status: str = "running"
    request_preview: Optional[str] = Field(default=None, sa_column=Column(Text))
    request_meta: dict = Field(default_factory=dict, sa_column=Column(JSON))
    response_preview: Optional[str] = Field(default=None, sa_column=Column(Text))
    response_meta: dict = Field(default_factory=dict, sa_column=Column(JSON))
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=_utcnow)
    finished_at: Optional[datetime] = None
    duration_ms: Optional[int] = None

    __table_args__ = (
        Index("idx_ai_traces_started", "started_at"),
        Index("idx_ai_traces_job", "job_id", "started_at"),
        Index("idx_ai_traces_kind", "kind", "started_at"),
    )
