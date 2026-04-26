"""image_concepts 시드 — 첫 실행 시에만 채움."""
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .models import ImageConcept


def _project_root() -> Path:
    # sidecar/shortify_sidecar/db/seed.py → 상위 3단계
    return Path(__file__).resolve().parents[3]


SEED = [
    {
        "slug": "diagram_whiteboard",
        "name": "Whiteboard Diagram",
        "description": "Hand-drawn arrows, boxes, and labels on a clean whiteboard.",
        "image_style_preset": (
            "clean whiteboard diagram, hand-drawn arrows and boxes, "
            "neat labels, technical illustration, monochrome with one accent color"
        ),
        "sort_order": 1,
    },
    {
        "slug": "illustrated_textbook",
        "name": "Illustrated Textbook",
        "description": "Polished textbook-style illustrations with soft colors.",
        "image_style_preset": (
            "textbook illustration, colored pencil texture, soft palette, "
            "clean schematic, educational art"
        ),
        "sort_order": 2,
    },
    {
        "slug": "minimalist_3d",
        "name": "Minimalist 3D",
        "description": "Soft-shadow minimal 3D renders in a single color tone.",
        "image_style_preset": (
            "minimal 3D render, monochrome palette, soft shadows, "
            "matte finish, isometric perspective"
        ),
        "sort_order": 3,
    },
    {
        "slug": "photorealistic",
        "name": "Photorealistic",
        "description": "Realistic photography with subtle on-image labels.",
        "image_style_preset": (
            "photorealistic photograph, natural lighting, "
            "subtle clean text labels overlaid, documentary feel"
        ),
        "sort_order": 4,
    },
    {
        "slug": "retro_paper",
        "name": "Retro Paper",
        "description": "Vintage paper texture with retro print colors.",
        "image_style_preset": (
            "vintage paper texture, retro print, halftone dots, "
            "muted earthy palette, 1970s educational poster"
        ),
        "sort_order": 5,
    },
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
