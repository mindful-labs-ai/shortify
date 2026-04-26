"""image_concepts 시드 — 첫 실행 시에만 채움."""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from .models import ImageConcept, Prompt


def _project_root() -> Path:
    # sidecar/shortify_sidecar/db/seed.py → 상위 3단계
    return Path(__file__).resolve().parents[3]


# 캐스트 슬레이트 — 6인. 명세는 wiki/design/character/{01-bible,03-cast}.md.
#   - Shori (마스코트 / 레서판다)             — final/sheet · turnaround 까지 ref
#   - Pip · Iris · Jay · Vera · Sage (5인)    — cast/<slug>/portrait_v1
SEED = [
    {
        # 대표 마스코트 / 앱 인격. 영상 본편에는 카메오만 (모서리 박수 등).
        # 자산: assets/image_concepts/shori/{preview, ref_main(=portrait),
        # ref_sheet, ref_front}.png — multi-ref 라 identity lock 이 가장 강함.
        "slug": "shori",
        "name": "Shori",
        "description": (
            "쇼리 — Shortify 의 대표 레서판다 마스코트 (앱 인격). "
            "Spark coral `#FF6B4A` 본체 + cream face mask + 줄무늬 꼬리. "
            "영상에는 카메오로만 등장 (모서리 박수, 인트로 등)."
        ),
        "image_style_preset": (
            "Character: 'Shori' — small friendly red panda mascot. "
            "Spark coral body (#FF6B4A), cream face mask around eyes, "
            "muzzle, chest, and inner ears (#FFF8F2), dark brown points "
            "on eyes/ear-tips/paws/nose (#3A2A23), soft pink blush, "
            "trademark striped tail (coral with darker coral-700 stripes). "
            "Soft warm illustration style, clean rounded lineart, gentle "
            "pastel palette. The reference images attached are the "
            "canonical character sheet — match face shape, eye placement, "
            "tail stripes, and proportions exactly. Shori is the same "
            "mascot across every scene; never restyle, never change "
            "species, never change palette. In educational scenes Shori "
            "appears as a small cameo (corner clap, intro, end card, "
            "celebration moment) — main subject of each scene is the "
            "concept itself, with Shori as a friendly accent."
        ),
        "sort_order": 1,
    },
    # ───────────── Cast 5인 (wiki/design/character/03-cast.md) ─────────────
    {
        "slug": "pip",
        "name": "Pip",
        "description": (
            "12세 ENFP, 호기심 폭발 '리액션 메이커'. '왜?'로 시작하는 "
            "과학 실험·수학 퍼즐·자연 현상·어린이/입문자용 콘텐츠. "
            "메인 컬러 sunny yellow `#FFC83D`."
        ),
        "image_style_preset": (
            "Character: 'Pip' — 12-year-old curious child, ENFP energy. "
            "Short bob hairstyle, bright wide eyes, oversized hoodie with "
            "hands tucked into front pocket, one knee-sock slipping down. "
            "Signature: lopsided open-mouth smile, eyes wide with surprise. "
            "Main color cue: sunny yellow #FFC83D in clothing or accent. "
            "Soft semi-realistic illustration style, clean lineart, bright "
            "cheerful palette. The reference image attached is the "
            "canonical front portrait — match face shape, hairstyle, and "
            "outfit exactly. Pip is the same character across every scene; "
            "never restyle or age. Pip reacts to the subject with surprise "
            "or excitement — pointing, leaning in, or wide-eyed wonder — "
            "to make the viewer feel the discovery."
        ),
        "sort_order": 2,
    },
    {
        "slug": "iris",
        "name": "Iris",
        "description": (
            "24세 INFJ, 사색적이고 차분한 통찰가. 인문·철학·심리·문학, "
            "'정답 없는 생각해볼 거리' 톤. "
            "메인 컬러 mint green `#5BD4A8` (영상 안 의상/소품 한정 — "
            "UI 의 '정답·완료' 의미와 충돌 방지)."
        ),
        "image_style_preset": (
            "Character: 'Iris' — 24-year-old thoughtful young woman, INFJ. "
            "Long straight hair tied to one side, round glasses, loose "
            "knit cardigan, frequently holding a book. Signature: head "
            "tilted slightly, soft contemplative smile. Main color cue: "
            "mint green #5BD4A8 only in clothing or props within the "
            "rendered scene — NOT used as a UI 'correct/done' element. "
            "Calm semi-realistic illustration style, clean lineart, muted "
            "natural palette. The reference image attached is the "
            "canonical front portrait — match face shape, hairstyle, "
            "glasses, and cardigan exactly. Iris is the same character "
            "across every scene; never restyle. Iris approaches the "
            "subject thoughtfully — hand near chin, leaning slightly, or "
            "gently touching the book."
        ),
        "sort_order": 3,
    },
    {
        "slug": "jay",
        "name": "Jay",
        "description": (
            "31세 ENTJ, 명료·효율 결론부터형. 비즈니스·경제·시사·IT 트렌드, "
            "'10초 안에 핵심' 60초 요약 톤. "
            "메인 컬러 sky blue `#4A9BFF`."
        ),
        "image_style_preset": (
            "Character: 'Jay' — 31-year-old confident professional, ENTJ. "
            "Tidy medium-length hair, crisp dress shirt with sleeves "
            "rolled up, uses fingers to count off points (1-2-3 gesture). "
            "Signature: direct gaze at camera, decisive set mouth, "
            "counting hand. Main color cue: sky blue #4A9BFF in shirt or "
            "accent. Sharp semi-realistic illustration style, clean "
            "confident lineart, crisp modern palette. The reference image "
            "attached is the canonical front portrait — match face, "
            "hairstyle, and shirt exactly. Jay is the same character "
            "across every scene; never restyle. Jay presents the subject "
            "as a numbered list or a single sharp point, gesturing "
            "decisively toward it."
        ),
        "sort_order": 4,
    },
    {
        "slug": "vera",
        "name": "Vera",
        "description": (
            "52세 ESFJ, 따뜻한 경험 기반 어른. 생활 지식·건강·요리·살림팁, "
            "'엄마·이모가 알려주는' 톤. 메인 컬러 lavender `#B69CE8`."
        ),
        "image_style_preset": (
            "Character: 'Vera' — 52-year-old warm middle-aged woman, "
            "ESFJ. Shoulder-length permed hair, pearl earrings, cardigan "
            "over a blouse, often holding a mug. Signature: hands "
            "clasped together, gentle eye-smile. Main color cue: "
            "lavender #B69CE8 in cardigan or accent. Warm semi-realistic "
            "illustration style, soft lineart, comforting palette. The "
            "reference image attached is the canonical front portrait — "
            "match face, hairstyle, earrings, and cardigan exactly. Vera "
            "is the same character across every scene; never restyle or "
            "re-age. Vera shares the subject as if telling a personal "
            "life lesson — hands open in welcome, or holding the subject "
            "like a treasured recipe."
        ),
        "sort_order": 5,
    },
    {
        "slug": "sage",
        "name": "Sage",
        "description": (
            "71세 ISTP, 과묵한 장인·전문가. 역사·전통·장인 기술·클래식, "
            "'한 분야를 평생 파온 사람' 깊이의 이야기 톤. "
            "메인 컬러 warm gray `#8B7E72`."
        ),
        "image_style_preset": (
            "Character: 'Sage' — 71-year-old quiet master craftsman, "
            "ISTP. Short white hair, round spectacles, vest over a "
            "shirt, almost always holding or working on something with "
            "his hands. Signature: faint knowing smile, slow nod. Main "
            "color cue: warm gray #8B7E72 in vest or accent. Refined "
            "semi-realistic illustration style, gentle lineart, muted "
            "earthy palette. The reference image attached is the "
            "canonical front portrait — match face, white hair, "
            "spectacles, and vest exactly. Sage is the same character "
            "across every scene; never restyle or re-age. Sage explains "
            "the subject with the patience of a lifetime — handling it "
            "carefully, examining it, or quietly demonstrating the "
            "technique."
        ),
        "sort_order": 6,
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
    # ORM hydration 우회: reference_image_paths 가 raw string 으로 잘못
    # 들어간 row 가 있으면 ImageConcept 인스턴스화 단계에서 json.loads 실패로
    # 부팅 자체가 죽는다. raw column 만 SELECT 해서 hydration 회피.
    result = await session.execute(select(ImageConcept.slug))
    existing_slugs = {row[0] for row in result.all()}
    added = 0
    assets_root = _project_root() / "assets" / "image_concepts"
    seed_slugs = {s["slug"] for s in SEED}

    # 기본은 로컬 자산 (외부 네트워크로 ref 가 안 나가게). 외부 호스트
    # (S3 / GitHub raw) 로 바꾸려면 SHORTIFY_ASSETS_BASE_URL 명시.
    #   비활성/없음                 → 로컬 절대경로 ('/abs/.../ref_main.png')
    #   'https://...' 로 시작        → 그 base + '/image_concepts/<slug>/<file>'
    # _safe_refs() 가 양쪽 모두 처리.
    import os as _os

    base_url = (_os.environ.get("SHORTIFY_ASSETS_BASE_URL") or "").strip().rstrip("/")
    use_remote = bool(base_url)

    for s in SEED:
        slug_dir = assets_root / s["slug"]
        preview = slug_dir / "preview.png"
        # 로컬 ref_*.png 가 있으면 그 이름들을, 없으면 ref_main.png 한 장 가정.
        # (디자이너가 자산만 올리고 코드 sync 가 늦어질 때를 위한 fallback.)
        ref_names = sorted(p.name for p in slug_dir.glob("ref_*.png"))
        if not ref_names:
            ref_names = ["ref_main.png"]
        if use_remote:
            refs = [
                f"{base_url}/image_concepts/{s['slug']}/{n}" for n in ref_names
            ]
        else:
            refs = [str(slug_dir / n) for n in ref_names]

        if s["slug"] in existing_slugs:
            # UPDATE — JSON 컬럼은 SQLAlchemy 가 list 를 직접 직렬화한다.
            await session.execute(
                update(ImageConcept)
                .where(ImageConcept.slug == s["slug"])
                .values(
                    name=s["name"],
                    description=s["description"],
                    image_style_preset=s["image_style_preset"],
                    reference_image_paths=refs or None,
                    preview_path=str(preview),
                    sort_order=s["sort_order"],
                    active=True,
                )
            )
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

    # 코드에서 빠진 캐릭터는 비활성화 (휴지통 역할).
    stale = existing_slugs - seed_slugs
    if stale:
        await session.execute(
            update(ImageConcept)
            .where(ImageConcept.slug.in_(stale))
            .values(active=False)
        )

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
