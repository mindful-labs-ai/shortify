"""PDF 목차화 → 영상 요청 단계로 넘길 데이터 형태 결정용 검증 스크립트.

[배경]
한 PDF 를 짧은 영상 한 묶음으로 만들 때, "목차 분할 단계"의 출력으로 그
다음 단계(conceptizer → image_gen → video_gen)에 무엇을 넘길지가 미정.
두 후보를 같은 데이터로 비교해 결정한다.

  Approach A — 목차만 만들 때 Gemini 가 함께 뽑은 summary / key_points 만으로
                바로 conceptizer 에 넘겨 영상 비트(JSON) 까지 만들 수 있나?
  Approach B — Gemini 는 페이지 범위만 정하고, 그 페이지를 pypdf 로 다시
                긁어 raw 본문 텍스트로 conceptizer 에 넘기는 쪽이 나은가?

[검증 흐름]
  Stage 1.  PDF → Gemini → 계층 TOC JSON (chapter > subsection,
            각 항목별 summary / key_points 포함)
            ⇒ Approach A 의 payload 원천
  Stage 2.  Stage 1 의 page_start/page_end 만 신뢰 → pypdf 로 페이지 텍스트 추출
            ⇒ Approach B 의 payload 원천
  Stage 3.  각 leaf section 마다 두 payload 로 conceptizer 를 실제로 호출
            (= 영상 요청 단계에서 받게 될 입력과 동일한 모양). 결과 side-by-side
            저장 → "어느 쪽이 영상화에 충분한가" 를 눈으로 즉시 판단.

[저장 결과] (tests/sidecar/output/, .gitignore 의 output/ 패턴에 매칭됨)
  - stage1_gemini_toc.json
  - stage2_section_contents.json
  - stage3_downstream_comparison.json   ← 두 방식 비교의 핵심

사용:
    # GEMINI_API_KEY 가 .env 또는 env 에 있어야 함
    python tests/sidecar/test_pdf_toc_split.py path/to/file.pdf
    python tests/sidecar/test_pdf_toc_split.py path/to/file.pdf --max-sections 3
    python tests/sidecar/test_pdf_toc_split.py path/to/file.pdf --skip-conceptize

    # pytest
    pytest tests/sidecar/test_pdf_toc_split.py --pdf path/to/file.pdf
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any

# sidecar 패키지 import 가능하도록
SIDECAR_ROOT = Path(__file__).resolve().parents[2] / "sidecar"
if str(SIDECAR_ROOT) not in sys.path:
    sys.path.insert(0, str(SIDECAR_ROOT))

from pypdf import PdfReader  # noqa: E402

from shortify_sidecar.pipeline import conceptizer  # noqa: E402
from shortify_sidecar.settings import settings  # noqa: E402


STAGE1_PROMPT = """\
You are given a full PDF document. Extract its table of contents as STRICT JSON
matching this hierarchical schema:

{
  "title": "<book or document title>",
  "language": "ko | en | other",
  "chapters": [
    {
      "idx": 0,
      "title": "Chapter title (numbering stripped)",
      "page_start": 0,
      "page_end": 12,
      "summary": "1-3 sentence summary of the whole chapter",
      "subsections": [
        {
          "idx": 0,
          "title": "Sub-section title",
          "page_start": 1,
          "page_end": 4,
          "summary": "2-4 sentence summary of THIS sub-section's actual content (specific, not generic)",
          "key_points": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]
        }
      ]
    }
  ]
}

RULES:
- Page numbers are 0-indexed (the PDF's first page is page 0).
- If the document has no explicit TOC, INFER chapter and sub-section
  boundaries from headings, formatting, and content shifts.
- Sub-sections MUST nest inside their parent chapter — never flatten.
- summary / key_points must reflect the ACTUAL content of those pages,
  enough that a downstream prompt could write a 30–60s explainer video
  WITHOUT re-reading the original page (this is critical — be specific
  about facts, mechanisms, definitions, examples).
- Preserve the document's language for titles / summaries (Korean stays
  Korean).
- Strip leading numbering ("1.", "Chapter 1:", "1.2", etc.) from titles.
- Return JSON ONLY — no prose, no markdown fences.
"""


# ───────────────────── Stage 1: Gemini → 계층 TOC ─────────────────────

async def stage1_gemini_toc(pdf_path: Path) -> dict:
    api_key = settings().gemini_api_key
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY 가 비어 있음 — .env 또는 환경변수에 설정 필요")

    def _call() -> str:
        import shutil
        import tempfile

        from google import genai
        from google.genai import types as gtypes

        client = genai.Client(api_key=api_key)

        # Files API 업로드는 파일명을 HTTP 헤더에 그대로 싣는 SDK 가 있어
        # 비-ASCII 경로 (한글 파일명 등) 에서 UnicodeEncodeError 발생.
        # → ASCII 만 들어간 임시경로로 복사한 뒤 업로드.
        contents: list[Any]
        with tempfile.TemporaryDirectory() as td:
            ascii_path = Path(td) / "input.pdf"
            shutil.copyfile(pdf_path, ascii_path)
            try:
                try:
                    uploaded = client.files.upload(file=str(ascii_path))
                except TypeError:
                    uploaded = client.files.upload(path=str(ascii_path))  # type: ignore[arg-type]
                contents = [uploaded, STAGE1_PROMPT]
            except Exception as up_err:  # noqa: BLE001
                # 인라인 폴백 — google-genai 1.x: from_bytes 는 keyword-only
                print(f"      [warn] Files API upload failed → inline fallback: {up_err}")
                contents = [
                    gtypes.Part.from_bytes(
                        data=pdf_path.read_bytes(),
                        mime_type="application/pdf",
                    ),
                    STAGE1_PROMPT,
                ]

            resp = client.models.generate_content(
                model=settings().model_text,
                contents=contents,
                config={"response_mime_type": "application/json"},
            )
            return resp.text

    raw = await asyncio.to_thread(_call)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"Gemini did not return valid JSON: {e}\nRAW (first 1000 chars):\n{raw[:1000]}"
        ) from e


# ───────────────────── Stage 2: TOC → pypdf 본문 추출 ─────────────────────

def _flatten_toc(toc: dict) -> list[dict]:
    flat: list[dict] = []
    for ch_i, chapter in enumerate(toc.get("chapters") or []):
        flat.append(
            {
                "level": "chapter",
                "chapter_idx": ch_i,
                "title": chapter.get("title"),
                "page_start": chapter.get("page_start"),
                "page_end": chapter.get("page_end"),
                "summary_from_gemini": chapter.get("summary"),
            }
        )
        for sub_i, sub in enumerate(chapter.get("subsections") or []):
            flat.append(
                {
                    "level": "subsection",
                    "chapter_idx": ch_i,
                    "subsection_idx": sub_i,
                    "parent_title": chapter.get("title"),
                    "title": sub.get("title"),
                    "page_start": sub.get("page_start"),
                    "page_end": sub.get("page_end"),
                    "summary_from_gemini": sub.get("summary"),
                    "key_points_from_gemini": sub.get("key_points") or [],
                }
            )
    return flat


def stage2_extract_sections(
    pdf_path: Path, toc: dict, max_chars: int = 4000
) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    total = len(reader.pages)
    out: list[dict] = []

    for entry in _flatten_toc(toc):
        ps = entry.get("page_start")
        pe = entry.get("page_end")
        if ps is None or pe is None:
            out.append({**entry, "extracted_snippet": None, "error": "missing page range"})
            continue
        try:
            ps = int(ps)
            pe = int(pe)
        except (TypeError, ValueError):
            out.append({**entry, "extracted_snippet": None, "error": f"non-int range: {ps},{pe}"})
            continue
        ps_c = max(0, ps)
        pe_c = min(total - 1, pe)
        if ps_c > pe_c:
            out.append(
                {
                    **entry,
                    "page_range_resolved": [ps_c, pe_c],
                    "extracted_snippet": None,
                    "error": f"invalid range after clamp: {ps_c} > {pe_c}",
                }
            )
            continue

        chunks: list[str] = []
        page_errors: list[str] = []
        for p in range(ps_c, pe_c + 1):
            try:
                chunks.append(reader.pages[p].extract_text() or "")
            except Exception as exc:  # noqa: BLE001
                page_errors.append(f"page {p}: {exc}")
        text = "\n".join(chunks).strip()
        out.append(
            {
                **entry,
                "page_range_resolved": [ps_c, pe_c],
                "page_count_in_range": pe_c - ps_c + 1,
                "char_count": len(text),
                "truncated": len(text) > max_chars,
                "extracted_snippet": text[:max_chars],
                "extracted_full": text,  # stage 3 에서 사용 (저장용 아님)
                "page_errors": page_errors or None,
            }
        )
    return out


# ───────────── Stage 3: 두 payload 로 conceptizer 호출 → side-by-side ─────────────

def _comparison_targets(
    toc: dict, stage2: list[dict]
) -> list[tuple[dict, dict | None]]:
    """비교 단위 = leaf section. subsection 이 있으면 그것, 없으면 chapter.

    각 target 에 대응하는 stage2 entry 도 함께 매칭.
    """
    by_idx: dict[tuple[str, int, int | None], dict] = {}
    for s in stage2:
        if s["level"] == "subsection":
            by_idx[("subsection", s["chapter_idx"], s["subsection_idx"])] = s
        else:
            by_idx[("chapter", s["chapter_idx"], None)] = s

    targets: list[tuple[dict, dict | None]] = []
    for ch_i, chapter in enumerate(toc.get("chapters") or []):
        subs = chapter.get("subsections") or []
        if subs:
            for sub_i, sub in enumerate(subs):
                meta = {
                    "level": "subsection",
                    "section_path": f"{chapter.get('title')} > {sub.get('title')}",
                    "title": sub.get("title"),
                    "parent_title": chapter.get("title"),
                    "page_range": [sub.get("page_start"), sub.get("page_end")],
                    "summary_from_gemini": sub.get("summary"),
                    "key_points_from_gemini": sub.get("key_points") or [],
                }
                targets.append((meta, by_idx.get(("subsection", ch_i, sub_i))))
        else:
            meta = {
                "level": "chapter",
                "section_path": chapter.get("title"),
                "title": chapter.get("title"),
                "parent_title": None,
                "page_range": [chapter.get("page_start"), chapter.get("page_end")],
                "summary_from_gemini": chapter.get("summary"),
                "key_points_from_gemini": chapter.get("key_points") or [],
            }
            targets.append((meta, by_idx.get(("chapter", ch_i, None))))
    return targets


def _approach_a_payload(meta: dict) -> str:
    """Approach A: Gemini TOC 결과의 summary + key_points 만으로 만든 passage."""
    parts = [f"Section: {meta.get('title')}"]
    if meta.get("parent_title"):
        parts.append(f"Parent chapter: {meta['parent_title']}")
    if meta.get("summary_from_gemini"):
        parts.append(f"Summary: {meta['summary_from_gemini']}")
    kps = meta.get("key_points_from_gemini") or []
    if kps:
        parts.append("Key points:\n" + "\n".join(f"- {kp}" for kp in kps))
    return "\n\n".join(parts)


def _approach_b_payload(stage2_entry: dict | None) -> str:
    """Approach B: pypdf 로 추출한 raw 본문 (conceptizer 가 내부 12k 컷)."""
    if not stage2_entry:
        return ""
    return (stage2_entry.get("extracted_full") or "").strip()


async def _conceptize_safe(passage: str, *, lang: str) -> dict:
    if not passage.strip():
        return {"_error": "empty passage"}
    try:
        return await conceptizer.conceptize(passage, lang=lang)
    except Exception as exc:  # noqa: BLE001
        return {"_error": f"{type(exc).__name__}: {exc}"}


def _diff_observations(a_concept: dict, b_concept: dict) -> dict:
    def _kw(d: dict) -> list[str]:
        return [str(x).lower() for x in (d.get("keywords") or [])]

    def _beats(d: dict) -> dict:
        return {b.get("kind"): b.get("text") for b in (d.get("beats") or [])}

    a_kw, b_kw = set(_kw(a_concept)), set(_kw(b_concept))
    a_beats, b_beats = _beats(a_concept), _beats(b_concept)
    return {
        "a_title": a_concept.get("title"),
        "b_title": b_concept.get("title"),
        "title_match_lower": (a_concept.get("title") or "").lower()
        == (b_concept.get("title") or "").lower(),
        "keywords_overlap": sorted(a_kw & b_kw),
        "keywords_only_a": sorted(a_kw - b_kw),
        "keywords_only_b": sorted(b_kw - a_kw),
        "beats_present_a": sorted(k for k, v in a_beats.items() if v),
        "beats_present_b": sorted(k for k, v in b_beats.items() if v),
        "a_has_error": "_error" in a_concept,
        "b_has_error": "_error" in b_concept,
    }


async def stage3_compare_downstream(
    toc: dict,
    stage2: list[dict],
    *,
    max_sections: int,
    lang: str,
) -> dict:
    targets = _comparison_targets(toc, stage2)
    if max_sections > 0:
        targets = targets[:max_sections]

    comparisons: list[dict] = []
    for meta, s2 in targets:
        a_passage = _approach_a_payload(meta)
        b_passage = _approach_b_payload(s2)

        # 두 호출은 독립 — 병렬
        a_concept, b_concept = await asyncio.gather(
            _conceptize_safe(a_passage, lang=lang),
            _conceptize_safe(b_passage, lang=lang),
        )

        comparisons.append(
            {
                "section_path": meta["section_path"],
                "level": meta["level"],
                "page_range": meta["page_range"],
                "approach_a_gemini_only": {
                    "payload_source": "gemini-toc.summary+key_points",
                    "payload_char_count": len(a_passage),
                    "payload_passage": a_passage,
                    "conceptized": a_concept,
                },
                "approach_b_pdf_extract": {
                    "payload_source": "pypdf.extract_pages",
                    "payload_char_count": len(b_passage),
                    "payload_passage_preview": b_passage[:2000],
                    "payload_passage_truncated": len(b_passage) > 2000,
                    "conceptized": b_concept,
                },
                "diff": _diff_observations(a_concept, b_concept),
            }
        )

    summary = {
        "n_compared": len(comparisons),
        "n_a_failed": sum(1 for c in comparisons if c["diff"]["a_has_error"]),
        "n_b_failed": sum(1 for c in comparisons if c["diff"]["b_has_error"]),
        "n_titles_match": sum(1 for c in comparisons if c["diff"]["title_match_lower"]),
        "avg_keywords_overlap": round(
            sum(len(c["diff"]["keywords_overlap"]) for c in comparisons)
            / max(1, len(comparisons)),
            2,
        ),
    }
    return {"summary": summary, "comparisons": comparisons}


# ───────────────────── 진입점 ─────────────────────

async def run(
    pdf_path: Path,
    out_dir: Path,
    *,
    max_chars: int,
    max_sections: int,
    skip_conceptize: bool,
    lang: str,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    stage1_path = out_dir / "stage1_gemini_toc.json"
    stage2_path = out_dir / "stage2_section_contents.json"
    stage3_path = out_dir / "stage3_downstream_comparison.json"

    # ── Stage 1
    print(f"[1/3] Gemini TOC 추출 — {pdf_path.name}", flush=True)
    toc = await stage1_gemini_toc(pdf_path)
    stage1_path.write_text(json.dumps(toc, ensure_ascii=False, indent=2), encoding="utf-8")
    chapters = toc.get("chapters") or []
    n_chap = len(chapters)
    n_sub = sum(len(c.get("subsections") or []) for c in chapters)
    has_details = any(
        bool(s.get("summary")) or bool(s.get("key_points"))
        for c in chapters
        for s in (c.get("subsections") or [])
    )
    print(
        f"      → {stage1_path}\n"
        f"        chapters={n_chap}  subsections={n_sub}  has_summary/key_points={has_details}",
        flush=True,
    )

    # ── Stage 2
    print("[2/3] TOC → pypdf 페이지 텍스트 추출", flush=True)
    sections = stage2_extract_sections(pdf_path, toc, max_chars=max_chars)
    # 저장 시 extracted_full 은 빼서 파일 폭발 방지
    stage2_payload = {
        "pdf": pdf_path.name,
        "total_sections": len(sections),
        "sections": [{k: v for k, v in s.items() if k != "extracted_full"} for s in sections],
    }
    stage2_path.write_text(
        json.dumps(stage2_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    n_ok = sum(1 for s in sections if s.get("extracted_snippet"))
    print(f"      → {stage2_path}\n        sections={len(sections)}  extracted_ok={n_ok}", flush=True)

    # ── Stage 3
    if skip_conceptize:
        print("[3/3] (skip) Approach A vs B conceptizer 비교 생략", flush=True)
        return {
            "stage1_path": str(stage1_path),
            "stage2_path": str(stage2_path),
            "stage3_path": None,
            "n_chapters": n_chap,
            "n_subsections": n_sub,
            "n_sections_extracted": n_ok,
        }

    print(
        f"[3/3] Approach A(목차 요약) vs B(pypdf 본문) 으로 conceptizer 호출 "
        f"(최대 {max_sections}개 섹션)",
        flush=True,
    )
    comparison = await stage3_compare_downstream(
        toc, sections, max_sections=max_sections, lang=lang
    )
    stage3_path.write_text(
        json.dumps(comparison, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    s = comparison["summary"]
    print(
        f"      → {stage3_path}\n"
        f"        compared={s['n_compared']}  A_failed={s['n_a_failed']}  "
        f"B_failed={s['n_b_failed']}  titles_match={s['n_titles_match']}  "
        f"avg_keyword_overlap={s['avg_keywords_overlap']}",
        flush=True,
    )

    print()
    print("=== Summary ===")
    print(f" Stage 1 (Gemini TOC):      chapters={n_chap}  subsections={n_sub}  details={has_details}")
    print(f" Stage 2 (PDF extract):     sections={len(sections)}  ok={n_ok}")
    print(
        f" Stage 3 (downstream A/B):  compared={s['n_compared']}  "
        f"A_fail={s['n_a_failed']}  B_fail={s['n_b_failed']}  "
        f"title_match={s['n_titles_match']}  kw_overlap_avg={s['avg_keywords_overlap']}"
    )
    print(f" Output dir:                {out_dir}")
    print()
    print("→ stage3 JSON 의 'comparisons[*].approach_{a,b}.conceptized' 를 양쪽")
    print("  눈으로 비교: 어느 쪽이 영상 비트 (hook/core/mechanism/recap) 를 더")
    print("  구체적·정확하게 만들어내는지가 핵심.")

    return {
        "stage1_path": str(stage1_path),
        "stage2_path": str(stage2_path),
        "stage3_path": str(stage3_path),
        "n_chapters": n_chap,
        "n_subsections": n_sub,
        "n_sections_extracted": n_ok,
        "stage3_summary": s,
    }


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="PDF TOC → downstream payload comparison test")
    p.add_argument("pdf", type=Path, help="검증할 PDF 경로")
    p.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).parent / "output",
        help="JSON 결과 저장 폴더 (기본: tests/sidecar/output)",
    )
    p.add_argument("--max-chars", type=int, default=4000, help="stage2 snippet 최대 길이")
    p.add_argument(
        "--max-sections",
        type=int,
        default=5,
        help="stage3 에서 conceptizer 호출할 leaf 섹션 수 상한 (기본 5, 0=무제한)",
    )
    p.add_argument(
        "--skip-conceptize",
        action="store_true",
        help="stage3 (Gemini conceptizer A/B 호출) 건너뜀 — 비용/시간 절약",
    )
    p.add_argument("--lang", default="en", help="conceptizer 출력 언어 (기본 en)")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    pdf_path: Path = args.pdf.expanduser().resolve()
    if not pdf_path.exists():
        print(f"[ERR] PDF not found: {pdf_path}", file=sys.stderr)
        return 1
    if pdf_path.suffix.lower() != ".pdf":
        print(f"[WARN] not a .pdf extension: {pdf_path}", file=sys.stderr)

    asyncio.run(
        run(
            pdf_path,
            args.out_dir,
            max_chars=args.max_chars,
            max_sections=args.max_sections,
            skip_conceptize=args.skip_conceptize,
            lang=args.lang,
        )
    )
    return 0


# ───────────────────── pytest 진입점 ─────────────────────

def pytest_addoption(parser):  # type: ignore[no-untyped-def]
    parser.addoption("--pdf", action="store", default=None, help="검증할 PDF 경로")
    parser.addoption(
        "--toc-out-dir",
        action="store",
        default=str(Path(__file__).parent / "output"),
        help="JSON 결과 저장 폴더",
    )
    parser.addoption(
        "--toc-max-sections",
        action="store",
        default="5",
        help="stage3 conceptizer 호출 상한",
    )
    parser.addoption(
        "--toc-skip-conceptize",
        action="store_true",
        default=False,
        help="stage3 (conceptizer A/B 호출) 스킵",
    )


def test_pdf_toc_two_stage(pytestconfig):  # type: ignore[no-untyped-def]
    import pytest

    pdf_arg = pytestconfig.getoption("--pdf")
    if not pdf_arg:
        pytest.skip("--pdf 미지정 — 통합 테스트 스킵")
    if not settings().gemini_api_key:
        pytest.skip("GEMINI_API_KEY 미설정 — 통합 테스트 스킵")

    pdf_path = Path(pdf_arg).expanduser().resolve()
    assert pdf_path.exists(), f"PDF not found: {pdf_path}"

    result = asyncio.run(
        run(
            pdf_path,
            Path(pytestconfig.getoption("--toc-out-dir")),
            max_chars=4000,
            max_sections=int(pytestconfig.getoption("--toc-max-sections")),
            skip_conceptize=bool(pytestconfig.getoption("--toc-skip-conceptize")),
            lang="en",
        )
    )

    assert result["n_chapters"] >= 1, "Gemini 가 챕터를 한 개도 반환하지 않음"
    assert result["n_sections_extracted"] >= 1, "PDF 에서 추출된 섹션 0"
    if result.get("stage3_summary"):
        s3 = result["stage3_summary"]
        assert s3["n_compared"] >= 1, "비교 대상 섹션이 0"


if __name__ == "__main__":
    raise SystemExit(main())
