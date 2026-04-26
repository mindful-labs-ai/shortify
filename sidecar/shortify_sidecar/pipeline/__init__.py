"""Pipeline 도메인 인터페이스.

워커는 이 Protocol 에만 의존한다. 실제 구현은 ``DefaultPipeline``.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Protocol


class Pipeline(Protocol):
    async def extract_toc(self, pdf_path: str, page_count: int) -> list[dict]: ...
    async def extract_section(self, pdf_path: str, section_idx: int, toc: list[dict]) -> str: ...
    async def conceptize(self, text: str, lang: str = "en") -> dict: ...
    def split_scenes(self, conceptized: dict, n: int = 14) -> list[dict]: ...
    async def generate_images(
        self,
        scenes: list[dict],
        concept_slug: str,
        *,
        job_id: str,
        conceptized: dict | None = None,
    ) -> list[Path]: ...
    async def generate_clips(
        self, images: list[Path], motion: str, *, job_id: str
    ) -> list[Path]: ...
    async def generate_narration(
        self, text: str, voice: str, speed: float, *, job_id: str
    ) -> Path: ...
    async def align_words(self, audio: Path, text: str) -> list[dict]: ...
    def compose_final(
        self,
        clips: list[Path],
        narration: Path,
        words: list[dict],
        concept_slug: str,
        conceptized: dict,
        *,
        job_id: str,
    ) -> Path: ...


@lru_cache(maxsize=1)
def get_pipeline() -> Pipeline:
    from .default import DefaultPipeline

    return DefaultPipeline()
