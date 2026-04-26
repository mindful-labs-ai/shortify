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
        # 메인 마스코트. v0 기본 슬레이트는 단일 캐릭터.
        # 추가 캐릭터는 동일한 dict 형태로 이 리스트에 append 하면 자동으로
        # 다음 부팅에서 upsert 된다 (코드에서 빠지면 active=False).
        "slug": "shorti",
        "name": "Shorti",
        "description": (
            "Shorti is a friendly young learner with a round face, soft "
            "navy short hair, and a warm bright smile. Wears a cream "
            "cardigan over a white tee and round glasses. Curious "
            "everyman who points and asks questions."
        ),
        "image_style_preset": (
            "Character: 'Shorti' — round-faced young learner, soft navy "
            "short hair, friendly bright eyes, round wire glasses, cream "
            "cardigan over white tee. Soft warm semi-realistic anime/"
            "illustration style, clean lineart, gentle pastel palette. "
            "Shorti is the same character across every scene; keep facial "
            "features, hair, and outfit identical. Shorti reacts to the "
            "subject by pointing, holding it, or looking at it on a board, "
            "so the viewer's eye reads (1) Shorti, (2) the concept."
        ),
        "sort_order": 1,
    },
]


async def seed_image_concepts(session: AsyncSession) -> int:
    """캐릭터 슬레이트 동기화.

    - 신규 slug → INSERT
    - 기존 slug → name/description/style_preset/sort_order 항상 UPSERT.
      (이미지 컨셉은 사용자가 SQL 로 손댈 일이 거의 없고, 코드의 캐릭터
      정의가 진실의 원천이므로 매 부팅마다 최신화한다.)
    - 코드에 없는 활성 row → 비활성화 (active=0). 데이터 보존을 위해
      DELETE 하지 않음.
    반환: 새로 INSERT 된 개수.
    """
    result = await session.execute(select(ImageConcept))
    existing: dict[str, ImageConcept] = {r.slug: r for r in result.scalars().all()}
    added = 0
    assets_root = _project_root() / "assets" / "image_concepts"
    seed_slugs = {s["slug"] for s in SEED}

    for s in SEED:
        slug_dir = assets_root / s["slug"]
        preview = slug_dir / "preview.png"
        refs = sorted(p.as_posix() for p in slug_dir.glob("ref_*.png"))

        if s["slug"] in existing:
            row = existing[s["slug"]]
            row.name = s["name"]
            row.description = s["description"]
            row.image_style_preset = s["image_style_preset"]
            row.reference_image_paths = refs or None
            row.preview_path = str(preview)
            row.sort_order = s["sort_order"]
            row.active = True
        else:
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

    # 코드에서 빠진 캐릭터는 비활성화 (휴지통 역할)
    for slug, row in existing.items():
        if slug not in seed_slugs and row.active:
            row.active = False

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
        # v2: scene 의 실제 PDF 본문 (SUBJECT) + KEYWORDS + TITLE 을 같이 주입.
        # 안 주면 모델이 STYLE+DIRECTION 만 보고 그려서 PDF 와 무관한 그림이 나옴.
        # 사용자가 v1 row 를 직접 수정한 경우 보존하기 위해 새 key 로 추가.
        "key": "image_gen_scene_v2",
        "description": (
            "Imagen prompt grounded in the source passage. STYLE_PRESET sets "
            "visual style; DIRECTION sets composition role; SUBJECT is the "
            "actual concept text from the PDF; KEYWORDS are highlighted terms; "
            "TITLE keeps the lesson topic anchored."
        ),
        "variables": [
            "STYLE_PRESET",
            "DIRECTION",
            "NEGATIVE",
            "SUBJECT",
            "KEYWORDS",
            "TITLE",
        ],
        "template": (
            "Concept: ${TITLE}$. Subject: ${SUBJECT}$. "
            "Highlight terms: ${KEYWORDS}$. "
            "Style: ${STYLE_PRESET}$. Composition: ${DIRECTION}$. "
            "Vertical 9:16 educational illustration. "
            "Stay faithful to the subject; do not invent unrelated content. "
            "Negative: ${NEGATIVE}$."
        ),
    },
    {
        # v3: 캐릭터 슬레이트 도입 후. STYLE_PRESET 자리에 'Shorti'/'Pico' 같은
        # 캐릭터 정의가 들어오므로 prompt 가 그 사실을 모델에 명시한다 —
        # "이 캐릭터가 SUBJECT 를 가르치는 장면을 그려라." 형식.
        "key": "image_gen_scene_v3",
        "description": (
            "Character-first Imagen prompt. CHARACTER (style preset) appears "
            "in every scene, identical face/outfit/proportions. SUBJECT is "
            "the PDF passage that the character is teaching/showing right "
            "now. DIRECTION says how this scene is framed (hook / step / "
            "recap). KEYWORDS get visible labels in the scene."
        ),
        "variables": [
            "STYLE_PRESET",
            "DIRECTION",
            "NEGATIVE",
            "SUBJECT",
            "KEYWORDS",
            "TITLE",
        ],
        "template": (
            "${STYLE_PRESET}$\n\n"
            "Lesson title (consistent across all scenes): ${TITLE}$.\n"
            "This scene's subject (from the source passage): ${SUBJECT}$.\n"
            "Terms to make visually prominent (as labels, captions, or "
            "objects): ${KEYWORDS}$.\n"
            "Scene composition role: ${DIRECTION}$.\n"
            "Render the character above teaching, demonstrating, or "
            "reacting to that subject. The character must be visibly "
            "present in the scene with the same face, hair, and outfit "
            "every time. Vertical 9:16 educational illustration, single "
            "focal subject, clean readable composition.\n"
            "Stay strictly faithful to the lesson topic and subject; do "
            "not invent unrelated concepts.\n"
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
