"""DefaultPipeline — 모듈을 와이어링한 단일 구현체."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .. import notify
from ..db.models import ImageConcept
from ..db.session import session_factory
from ..storage.paths import output_dir
from . import _gemini, alignment, compose, conceptizer, ingest_pdf, narration_gen
from . import image_gen, scene_splitter, video_gen

log = logging.getLogger("shortify.pipeline")


class DefaultPipeline:
    # ─────── PDF ───────
    async def extract_toc(self, pdf_path: str, page_count: int) -> list[dict]:
        return await ingest_pdf.extract_toc(Path(pdf_path), page_count)

    async def extract_section(
        self, pdf_path: str, section_idx: int, toc: list[dict]
    ) -> str:
        return await ingest_pdf.extract_section(Path(pdf_path), section_idx, toc)

    # ─────── 컨셉 / 씬 ───────
    async def conceptize(self, text: str, lang: str = "en") -> dict:
        return await conceptizer.conceptize(text, lang=lang)

    def split_scenes(self, conceptized: dict, n: int = 14) -> list[dict]:
        return scene_splitter.split(conceptized, n=n)

    # ─────── 외부 AI ───────
    async def generate_images(
        self,
        scenes: list[dict],
        concept_slug: str,
        *,
        job_id: str,
        conceptized: dict | None = None,
    ) -> list[Path]:
        async with session_factory()() as s:
            concept = (
                await s.execute(
                    select(ImageConcept).where(ImageConcept.slug == concept_slug)
                )
            ).scalar_one()
        out = output_dir(job_id) / "images"
        return await image_gen.generate(
            scenes, concept, out, job_id=job_id, conceptized=conceptized
        )

    async def generate_clips(
        self, images: list[Path], motion: str, *, job_id: str
    ) -> list[Path]:
        out = output_dir(job_id) / "clips"
        return await video_gen.generate(images, motion, out, job_id=job_id)

    async def generate_narration(
        self, text: str, voice: str, speed: float, *, job_id: str
    ) -> Path:
        # Gemini native audio 는 raw PCM → _gemini.tts 가 WAV 헤더를 prepend.
        out = output_dir(job_id) / "narration.wav"
        return await narration_gen.tts(text, voice=voice, speed=speed, out_path=out)

    async def align_words(self, audio: Path, text: str) -> list[dict]:
        return await alignment.align(audio, text)

    # ─────── 컴포즈 ───────
    def compose_final(
        self,
        clips: list[Path],
        narration: Path,
        words: list[dict],
        concept_slug: str,
        conceptized: dict,
        *,
        job_id: str,
    ) -> Path:
        out = output_dir(job_id) / "final.mp4"
        return compose.compose_final(
            clips=clips,
            narration=narration,
            words=words,
            concept_slug=concept_slug,
            conceptized=conceptized,
            out=out,
            job_id=job_id,
        )
