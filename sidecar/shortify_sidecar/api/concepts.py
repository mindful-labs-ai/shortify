from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get("/image-concepts")
def list_image_concepts() -> list[dict]:
    """5종 비주얼 컨셉 카드. Phase 0 stub.

    실 구현 시 assets/image_concepts/<slug>/ 시드 + DB image_concepts 테이블 조회.
    """
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "concepts not yet implemented")
