from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()


class CreateJobsRequest(BaseModel):
    pdf_id: str
    sections: list[int]


class SelectImageRequest(BaseModel):
    image_concept_slug: str


@router.post("/jobs")
def create_jobs(req: CreateJobsRequest) -> dict:
    """N개 Job 생성 후 conceptize task enqueue. Phase 0 stub."""
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "create_jobs not yet implemented")


@router.get("/jobs")
def list_jobs() -> list[dict]:
    """전체 Job 목록 (라이브러리). Phase 0 stub."""
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "list_jobs not yet implemented")


@router.get("/jobs/{job_id}")
def get_job(job_id: str) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "get_job not yet implemented")


@router.get("/jobs/{job_id}/stream")
def stream_job(job_id: str):
    """SSE 진행 스트림. Phase 0 stub."""
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "stream not yet implemented")


@router.post("/jobs/{job_id}/select-image")
def select_image(job_id: str, req: SelectImageRequest) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "select_image not yet implemented")


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: str) -> dict:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "retry not yet implemented")


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str) -> dict:
    """Soft delete: jobs.deleted_at = now(). 파일 보존. Phase 0 stub."""
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "soft delete not yet implemented")


@router.post("/jobs/{job_id}/restore")
def restore_job(job_id: str) -> dict:
    """Soft delete 복원: deleted_at = NULL. Phase 0 stub."""
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "restore not yet implemented")


@router.delete("/trash")
def empty_trash() -> dict:
    """휴지통 비우기 — 모든 deleted_at IS NOT NULL 행 hard delete + 파일 회수.
    비가역. Phase 0 stub.
    """
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "empty_trash not yet implemented")
