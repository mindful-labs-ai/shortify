"""image_concepts 시드 — 첫 실행 시에만 채움."""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .models import ImageConcept, Prompt


def _project_root() -> Path:
    # sidecar/shortify_sidecar/db/seed.py → 상위 3단계
    return Path(__file__).resolve().parents[3]


SEED = [
    {
        "slug": "shorti",
        "name": "Shorti",
        "description": "Hand-drawn arrows, boxes, and labels on a clean whiteboard.",
        "image_style_preset": (
            "clean whiteboard diagram, hand-drawn arrows and boxes, "
            "neat labels, technical illustration, monochrome with one accent color"
        ),
        "sort_order": 1,
    }
]


async def seed_image_concepts(session: AsyncSession) -> int:
    """존재하지 않는 슬러그만 insert. 반환: 새로 추가된 개수."""
    result = await session.execute(select(ImageConcept.slug))
    existing = {row[0] for row in result.all()}
    added = 0
    assets_root = _project_root() / "assets" / "image_concepts"
    for s in SEED:
        if s["slug"] in existing:
            continue
        slug_dir = assets_root / s["slug"]
        preview = slug_dir / "preview.png"
        refs = sorted(p.as_posix() for p in slug_dir.glob("ref_*.png"))
        session.add(
            ImageConcept(
                slug=s["slug"],
                name=s["name"],
                description=s["description"],
                preview_path=str(preview),
                image_style_preset=s["image_style_preset"],
                reference_image_paths=refs or None,
                active=True,
                sort_order=s["sort_order"],
            )
        )
        added += 1
    if added:
        await session.commit()
    return added


def write_seed_concept_files() -> None:
    """assets/image_concepts/<slug>/concept.json 만 생성 (이미지는 디자이너가 채움)."""
    root = _project_root() / "assets" / "image_concepts"
    for s in SEED:
        d = root / s["slug"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "concept.json").write_text(json.dumps(s, indent=2, ensure_ascii=False))


# ────────────────────────── prompts seed ──────────────────────────
#
# 변수 치환 패턴: ${VARNAME}$ (대문자/숫자/언더스코어). 사용자가 SQL 로 직접
# UPDATE 해서 수정 가능 — seed 는 idempotent 라 기존 row 를 덮어쓰지 않는다.

PROMPT_SEED: list[dict] = [
    {
        "key": "pdf_toc",
        "description": "Extract a flat TOC from an attached PDF (sent as inline part).",
        "variables": ["PAGE_COUNT", "PAGE_LAST"],
        "template": (
            "Extract the table of contents from this PDF. "
            "Return a strict JSON array of "
            '{"title": str, "page_start": int 0-indexed, '
            '"page_end": int 0-indexed inclusive, "depth": int}. '
            "Total page count is ${PAGE_COUNT}$; page_start and page_end "
            "must be within [0, ${PAGE_LAST}$]. "
            "Use depth 0 for top-level sections, 1+ for nested. "
            "If the PDF has no explicit TOC, infer reasonable sections "
            "from headings or split evenly."
        ),
    },
    {
        "key": "conceptizer_system",
        "description": "System prompt: extract a 4-beat learning structure from a textbook passage.",
        "variables": ["LANG"],
        "template": (
            "You are a learning-design assistant. Given a passage from a textbook, "
            "extract one core concept and structure it for a 30-60s short-form video.\n"
            "Output STRICT JSON matching this schema:\n"
            "{\n"
            '  "title": str (English, <40 chars),\n'
            '  "topic": str (one-line context),\n'
            '  "beats": [\n'
            '    {"kind":"hook",      "text": str (15-25 words, opens with a question or surprise)},\n'
            '    {"kind":"core",      "text": str (one sentence, the central claim)},\n'
            '    {"kind":"mechanism", "text": str (1-2 sentences, how/why it works)},\n'
            '    {"kind":"recap",     "text": str (one short sentence, restates the gist)}\n'
            "  ],\n"
            '  "keywords": [str, ...] (3-6 terms to highlight),\n'
            '  "citation": {"source_title": str|null, "page": int|null}\n'
            "}\n"
            "Output language: ${LANG}$."
        ),
    },
    {
        "key": "conceptizer_user",
        "description": "User prompt wrapping the passage text for conceptize.",
        "variables": ["TEXT"],
        "template": "Passage:\n\n${TEXT}$",
    },
    {
        "key": "image_gen_scene",
        "description": "Imagen prompt for a single scene with style preset and direction.",
        "variables": ["STYLE_PRESET", "DIRECTION", "NEGATIVE"],
        "template": (
            "${STYLE_PRESET}$. ${DIRECTION}$. "
            "Vertical 9:16 composition. "
            "Negative: ${NEGATIVE}$."
        ),
    },
    {
        "key": "align_words_audio",
        "description": "Audio-understanding prompt: word-level timestamps for narration MP3.",
        "variables": ["TRANSCRIPT"],
        "template": (
            "Return word-level timestamps for the spoken audio aligned to the "
            "transcript. Output strict JSON array of "
            '{"word": str, "start": float seconds, "end": float seconds}. '
            "Transcript: ${TRANSCRIPT}$"
        ),
    },
    {
        "key": "motion_subtle",
        "description": "Veo I2V motion prompt — subtle camera drift.",
        "variables": [],
        "template": "slow gentle pan, minimal motion, breathing room, soft camera drift",
    },
    {
        "key": "motion_medium",
        "description": "Veo I2V motion prompt — moderate camera dolly.",
        "variables": [],
        "template": "moderate camera dolly, light parallax",
    },
    {
        "key": "motion_static",
        "description": "Veo I2V motion prompt — no camera motion, only element animation.",
        "variables": [],
        "template": "no camera motion, only subtle element animation",
    },
]


async def seed_prompts(session: AsyncSession) -> int:
    """존재하지 않는 key 만 insert. 반환: 새로 추가된 개수.

    사용자가 직접 수정한 row 는 보존된다 (덮어쓰지 않음).
    """
    result = await session.execute(select(Prompt.key))
    existing = {row[0] for row in result.all()}
    added = 0
    for p in PROMPT_SEED:
        if p["key"] in existing:
            continue
        session.add(
            Prompt(
                key=p["key"],
                template=p["template"],
                description=p["description"],
                variables=p["variables"] or None,
            )
        )
        added += 1
    if added:
        await session.commit()
    return added
