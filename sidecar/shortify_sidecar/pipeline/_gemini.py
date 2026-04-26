"""google-genai 단일 클라이언트 — 모든 외부 AI 호출에 사용.

사용 model id 는 ``settings()`` 에서 주입.
TODO: SDK 스펙 확정되면 method 시그니처 미세 조정. 현재 구조는
``google-genai`` 0.3+ 의 ``Client.models.generate_*`` 패턴을 따른다.
"""

from __future__ import annotations

import asyncio
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

# Veo 폴링/다운로드에서 일시 오류로 보고 재시도할 키워드.
_VEO_TRANSIENT_HINTS = (
    "503",
    "504",
    "408",
    "UNAVAILABLE",
    "Deadline",
    "timed out",
    "timeout",
    "ConnectionReset",
    "ConnectionError",
)

from .. import prompts as _prompts
from ..settings import settings
from ._trace import trace

log = logging.getLogger("shortify.gemini")


@lru_cache(maxsize=1)
def client():
    """google-genai Client. 키가 없으면 호출 시점에 명확히 실패."""
    key = settings().gemini_api_key
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY missing. Set in Keychain (Settings UI) or .env"
        )
    from google import genai  # late import — 미설치 시 sidecar 부팅은 막지 않음

    return genai.Client(api_key=key)


async def list_models() -> list[dict]:
    """현재 API 키로 보이는 모델 + 지원 메소드. 진단용.

    google-genai SDK 응답 객체는 버전마다 흔들려서 가능한 필드만 방어적으로 추출.
    """

    def _call() -> list[dict]:
        c = client()
        out: list[dict] = []
        for m in c.models.list():
            out.append(
                {
                    "name": getattr(m, "name", None),
                    "display_name": getattr(m, "display_name", None),
                    "version": getattr(m, "version", None),
                    "description": getattr(m, "description", None),
                    "input_token_limit": getattr(m, "input_token_limit", None),
                    "output_token_limit": getattr(m, "output_token_limit", None),
                    "supported_actions": list(
                        getattr(m, "supported_actions", None) or []
                    ),
                    "supported_generation_methods": list(
                        getattr(m, "supported_generation_methods", None) or []
                    ),
                }
            )
        return out

    return await asyncio.to_thread(_call)


async def text_json(prompt: str, *, system: str | None = None) -> dict:
    """텍스트 → JSON 응답. 실패 시 RuntimeError."""
    import json as _json

    def _call():
        c = client()
        resp = c.models.generate_content(
            model=settings().model_text,
            contents=prompt,
            config={
                "system_instruction": system,
                "response_mime_type": "application/json",
            },
        )
        return resp.text

    log.info(
        "gemini.text_json model=%s prompt_len=%d", settings().model_text, len(prompt)
    )
    async with trace(
        kind="text_json",
        model=settings().model_text,
        request_preview=(f"system: {system}\n\n" if system else "") + prompt,
        request_meta={"prompt_len": len(prompt), "has_system": bool(system)},
    ) as tr:
        raw = await asyncio.to_thread(_call)
        tr.response_preview = raw
        tr.response_meta = {"resp_len": len(raw or "")}
    try:
        return _json.loads(raw)
    except Exception as e:  # noqa: BLE001
        log.error("Gemini JSON parse failed: %s", raw[:500])
        raise RuntimeError(f"Gemini did not return valid JSON: {e}") from e


async def pdf_toc(pdf_path: Path, page_count: int) -> list[dict]:
    """PDF 전체를 Gemini 에 첨부해 flat TOC 를 추출."""
    import json as _json

    prompt = await _prompts.get(
        "pdf_toc",
        PAGE_COUNT=page_count,
        PAGE_LAST=page_count - 1,
    )

    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        resp = c.models.generate_content(
            model=settings().model_text,
            contents=[
                prompt,
                gtypes.Part.from_bytes(
                    data=pdf_path.read_bytes(), mime_type="application/pdf"
                ),
            ],
            config={"response_mime_type": "application/json"},
        )
        return resp.text

    log.info(
        "gemini.pdf_toc model=%s pdf=%s pages=%d",
        settings().model_text,
        pdf_path.name,
        page_count,
    )
    pdf_size = pdf_path.stat().st_size if pdf_path.exists() else None
    async with trace(
        kind="pdf_toc",
        model=settings().model_text,
        request_preview=prompt,
        request_meta={
            "pdf_name": pdf_path.name,
            "pdf_bytes": pdf_size,
            "page_count": page_count,
        },
    ) as tr:
        raw = await asyncio.to_thread(_call)
        tr.response_preview = raw
        tr.response_meta = {"resp_len": len(raw or "")}
    try:
        parsed = _json.loads(raw)
    except Exception as e:  # noqa: BLE001
        log.error("Gemini JSON parse failed: %s", (raw or "")[:500])
        raise RuntimeError(f"Gemini did not return valid JSON: {e}") from e
    items = parsed if isinstance(parsed, list) else parsed.get("sections", [])
    out: list[dict] = []
    for it in items:
        title = str(it.get("title", "")).strip()
        if not title:
            continue
        out.append(
            {
                "idx": len(out),
                "title": title,
                "page_start": max(0, int(it.get("page_start", 0))),
                "page_end": min(
                    page_count - 1, int(it.get("page_end", page_count - 1))
                ),
                "depth": int(it.get("depth", 0)),
            }
        )
    return out


async def pdf_section_text(pdf_bytes: bytes, *, title: str = "") -> str:
    """선택 페이지 범위만 담긴 PDF bytes → 정제된 본문 텍스트.

    pypdf 가 텍스트 레이어가 없는 PDF (스캔본 등) 에서 빈 문자열을 돌려줄 때
    multimodal Gemini 가 OCR + 정리 역할을 한다. 응답은 plain text.
    """
    prompt = (
        "Extract the readable body text of this PDF section, faithful to "
        "the source. Preserve original language. Strip running headers, "
        "page numbers, footnotes, and image captions. Return ONLY the "
        "extracted text — no summarization, no commentary."
    )
    if title:
        prompt += f"\n\nFor reference, the section title is: '{title}'."

    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        resp = c.models.generate_content(
            model=settings().model_text,
            contents=[
                prompt,
                gtypes.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
            ],
        )
        return resp.text

    log.info(
        "gemini.pdf_section_text model=%s pdf_bytes=%d title=%r",
        settings().model_text,
        len(pdf_bytes),
        title[:40],
    )
    async with trace(
        kind="pdf_section_text",
        model=settings().model_text,
        request_preview=prompt,
        request_meta={"pdf_bytes": len(pdf_bytes), "title": title},
    ) as tr:
        out = await asyncio.to_thread(_call)
        tr.response_preview = (out or "")[:2000]
        tr.response_meta = {"resp_len": len(out or "")}
    return out or ""


async def text(prompt: str, *, system: str | None = None) -> str:
    def _call():
        c = client()
        resp = c.models.generate_content(
            model=settings().model_text,
            contents=prompt,
            config={"system_instruction": system} if system else None,
        )
        return resp.text

    log.info("gemini.text model=%s prompt_len=%d", settings().model_text, len(prompt))
    async with trace(
        kind="text",
        model=settings().model_text,
        request_preview=(f"system: {system}\n\n" if system else "") + prompt,
        request_meta={"prompt_len": len(prompt), "has_system": bool(system)},
    ) as tr:
        out = await asyncio.to_thread(_call)
        tr.response_preview = out
        tr.response_meta = {"resp_len": len(out or "")}
    return out


async def image(
    prompt: str, out_path: Path, *, ref_images: list[Path] | None = None
) -> Path:
    """Imagen / gemini-image — 1장 생성 후 PNG 저장."""

    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        # 캐릭터 일관성을 위해 ref 이미지를 prompt 앞에 두고, 그 사실을
        # 명시적으로 알려준다. 안 그러면 모델이 ref 를 "느슨한 영감"으로만
        # 참고해서 매 씬마다 얼굴/머리/옷이 흔들린다.
        contents: list[Any] = []
        if ref_images:
            preface = (
                "CHARACTER REFERENCE — read this carefully:\n"
                f"The next {len(ref_images)} image(s) define the EXACT "
                "appearance of the main character. This is identity, not "
                "style. The character you draw must match these references "
                "in every visible feature: face shape, eyes, nose, mouth, "
                "hair color, hairstyle, skin tone, body proportions, "
                "clothing, accessories. Do NOT redesign, age, restyle, or "
                "reinterpret the character. If the scene's mood differs, "
                "change only the pose, expression, and background — keep "
                "the character itself identical."
            )
            contents.append(preface)
            # 캐릭터 고정 강도를 높이기 위해 ref 를 두 번 반복 첨부.
            # API 호출당 다른 응답이 나와도 identity 가 흔들리지 않도록.
            for p in ref_images:
                ref_bytes = p.read_bytes()
                # 1회차
                contents.append(
                    gtypes.Part.from_bytes(data=ref_bytes, mime_type="image/png")
                )
            contents.append(
                "(End of character references. The character above is fixed.)"
            )
            for p in ref_images:
                # 2회차 — prompt 직전에 다시 보여줘서 마지막에 본 인상을 강화
                contents.append(
                    gtypes.Part.from_bytes(
                        data=p.read_bytes(), mime_type="image/png"
                    )
                )
            contents.append(
                "Now render the following scene featuring that EXACT same "
                "character (do not change their appearance):\n\n" + prompt
            )
        else:
            contents.append(prompt)
        resp = c.models.generate_content(
            model=settings().model_image,
            contents=contents,
            # gemini-*-image-preview 는 일부 변종이 IMAGE-only modality 를 거부.
            # TEXT 도 함께 허용해 받고, 우리는 inline_data (이미지 blob) 만 사용.
            config=gtypes.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        # 응답 구조 방어: candidates / content / parts 어느 단계든 None 가능
        candidates = getattr(resp, "candidates", None) or []
        prompt_feedback = getattr(resp, "prompt_feedback", None)
        block_reason = getattr(prompt_feedback, "block_reason", None)

        if not candidates:
            raise RuntimeError(
                f"Gemini image: empty candidates"
                + (f" (blocked: {block_reason})" if block_reason else "")
            )

        cand = candidates[0]
        finish_reason = getattr(cand, "finish_reason", None)
        finish_message = getattr(cand, "finish_message", None)
        safety = getattr(cand, "safety_ratings", None) or []

        content = getattr(cand, "content", None)
        parts = getattr(content, "parts", None) or []

        # inline_data (이미지 blob) 가 첫 번째로 오는 part 찾기
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                out_path.write_bytes(inline.data)
                return len(inline.data)

        # 실패 — 모든 진단 정보 모아서 노출
        text_dump = " | ".join(
            (getattr(p, "text", None) or "") for p in parts if getattr(p, "text", None)
        )[:500]
        safety_dump = ", ".join(
            f"{getattr(r, 'category', '?')}={getattr(r, 'probability', '?')}"
            for r in safety
            if getattr(r, "blocked", False)
            or str(getattr(r, "probability", "")).upper() in {"HIGH", "MEDIUM"}
        )
        details = []
        if block_reason:
            details.append(f"prompt_blocked={block_reason}")
        if finish_reason:
            details.append(f"finish_reason={finish_reason}")
        if finish_message:
            details.append(f"finish_message={finish_message}")
        if safety_dump:
            details.append(f"safety=[{safety_dump}]")
        if text_dump:
            details.append(f"text='{text_dump}'")
        details.append(f"n_parts={len(parts)}")

        raise RuntimeError(
            f"Gemini image: no inline_data (model={settings().model_image}) — "
            + "; ".join(details)
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    n_refs = len(ref_images or [])
    log.info(
        "gemini.image model=%s out=%s refs=%d",
        settings().model_image,
        out_path.name,
        n_refs,
    )
    async with trace(
        kind="image",
        model=settings().model_image,
        # admin Traces 패널에서 ref 사용 여부와 scene prompt 모두 확인 가능하게
        request_preview=(
            (
                f"[refs={n_refs}: {', '.join(p.name for p in (ref_images or []))}] "
                if n_refs
                else ""
            )
            + prompt
        ),
        request_meta={
            "out": out_path.name,
            "n_refs": n_refs,
            "ref_names": [p.name for p in (ref_images or [])],
            "ref_bytes": sum(
                p.stat().st_size for p in (ref_images or []) if p.exists()
            ),
        },
    ) as tr:
        size = await asyncio.to_thread(_call)
        tr.response_preview = f"<png saved: {out_path.name} ({size} bytes)>"
        tr.response_meta = {"out_path": str(out_path), "out_bytes": size}
    return out_path


async def i2v(
    image_path: Path,
    motion_prompt: str,
    out_path: Path,
    *,
    duration_sec: int | None = None,
) -> Path:
    """Veo I2V — 이미지 1장 → MP4. duration_sec 미지정 시 settings 기본값."""

    # 모델 허용 범위 (Veo 3.x: 4~8 inclusive) 안으로 클램프.
    raw = duration_sec if duration_sec is not None else settings().video_duration_sec
    safe_dur = max(4, min(8, int(raw)))

    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        # SDK 자체 retry: 5xx / 503(UNAVAILABLE) 시 지수 백오프.
        # Veo 호출 자체가 응답까지 60~300s 걸린다 (LRO 가 아니라 초기
        # generate_videos 응답 자체도 길다). timeout=120s 였을 때 가장
        # 흔한 실패가 'read operation timed out' 이라 5분으로 늘림.
        # 환경변수 SHORTIFY_VEO_TIMEOUT_SEC 로 조정 가능 (기본 300).
        veo_timeout_sec = int(os.environ.get("SHORTIFY_VEO_TIMEOUT_SEC", "300"))
        http_opts = gtypes.HttpOptions(
            timeout=veo_timeout_sec * 1000,
            retry_options=gtypes.HttpRetryOptions(
                attempts=3,
                initial_delay=3.0,
                max_delay=30.0,
                exp_base=2.0,
                jitter=0.5,
                # 408 (Request Timeout) 도 추가 — read timeout 도 transient.
                http_status_codes=[408, 429, 500, 502, 503, 504],
            ),
        )

        # Image.from_file 시그니처가 SDK 버전마다 흔들려서 직접 생성으로 우회.
        img = gtypes.Image(
            image_bytes=image_path.read_bytes(),
            mime_type="image/png",
        )
        op = c.models.generate_videos(
            model=settings().model_video,
            prompt=motion_prompt,
            image=img,
            config=gtypes.GenerateVideosConfig(
                duration_seconds=safe_dur,
                aspect_ratio="9:16",
                http_options=http_opts,
            ),
        )

        # long-running operation poll — 폴링 자체가 503 으로 떨어질 수 있어
        # 일시 오류는 계속 재시도. 최대 30 분.
        import time as _t

        deadline = _t.time() + 30 * 60
        consecutive_err = 0
        while not op.done:
            if _t.time() > deadline:
                raise RuntimeError("Veo polling timed out after 30 min")
            _t.sleep(5)
            try:
                op = c.operations.get(op)
                consecutive_err = 0
            except Exception as e:  # noqa: BLE001
                msg = str(e)
                transient = any(h in msg for h in _VEO_TRANSIENT_HINTS)
                if not transient:
                    raise
                consecutive_err += 1
                if consecutive_err >= 6:  # ~30s 내내 실패면 포기
                    raise RuntimeError(
                        f"Veo polling: transient errors did not recover ({msg})"
                    ) from e
                # 지수 백오프 — 추가 대기
                _t.sleep(min(30, 2**consecutive_err))
        # operation 자체가 실패로 끝났는지 먼저 확인 — done=True 라도 error 가 채워질 수 있음
        op_err = getattr(op, "error", None)
        if op_err:
            raise RuntimeError(f"Veo operation error: {op_err}")
        # SDK 버전에 따라 response 또는 result 에 본문이 옴
        resp = getattr(op, "response", None) or getattr(op, "result", None)
        if resp is None:
            raise RuntimeError("Veo: operation done but no response/result body")
        # RAI 필터로 모두 걸러지면 generated_videos 가 비어있음 — 이유 노출
        rai_count = getattr(resp, "rai_media_filtered_count", None) or 0
        rai_reasons = getattr(resp, "rai_media_filtered_reasons", None) or []
        gen_videos = getattr(resp, "generated_videos", None) or []
        if not gen_videos:
            if rai_count or rai_reasons:
                raise RuntimeError(
                    f"Veo: all {rai_count or '?'} candidate(s) filtered by RAI: "
                    f"{rai_reasons}"
                )
            raise RuntimeError(
                f"Veo: empty generated_videos (resp keys: "
                f"{list(getattr(resp, 'model_dump', dict)(exclude_none=True).keys())})"
            )
        v = gen_videos[0].video
        if v is None:
            raise RuntimeError("Veo: first generated_video has no .video field")
        # 1) inline bytes 가 이미 있으면 그대로 저장
        vb = getattr(v, "video_bytes", None)
        if vb:
            out_path.write_bytes(vb)
        else:
            # 2) URI 만 있으면 files.download 로 다운로드.
            #    (Video.save 는 'Saving remote videos is not supported' 로 거절함)
            uri = getattr(v, "uri", None)
            if not uri:
                raise RuntimeError("Veo: response has neither video_bytes nor uri")
            # files.download 도 일시 503 가능 — 짧은 retry 루프
            data = None
            last_err: Exception | None = None
            for attempt in range(4):
                try:
                    data = c.files.download(file=v)
                    if data:
                        break
                except Exception as e:  # noqa: BLE001
                    last_err = e
                    msg = str(e)
                    if not any(h in msg for h in _VEO_TRANSIENT_HINTS):
                        raise
                _t.sleep(2**attempt)
            if not data:
                raise RuntimeError(
                    f"Veo: empty download from {uri}"
                    + (f" — {last_err}" if last_err else "")
                )
            out_path.write_bytes(data)
        return out_path.stat().st_size if out_path.exists() else None

    out_path.parent.mkdir(parents=True, exist_ok=True)
    log.info(
        "gemini.i2v model=%s in=%s dur=%ds (requested=%s)",
        settings().model_video,
        image_path.name,
        safe_dur,
        duration_sec,
    )
    async with trace(
        kind="i2v",
        model=settings().model_video,
        request_preview=motion_prompt,
        request_meta={
            "image": image_path.name,
            "out": out_path.name,
            "duration_sec": safe_dur,
            "duration_sec_requested": duration_sec,
            "aspect_ratio": "9:16",
        },
    ) as tr:
        size = await asyncio.to_thread(_call)
        tr.response_preview = f"<mp4 saved: {out_path.name} ({size} bytes)>"
        tr.response_meta = {"out_path": str(out_path), "out_bytes": size}
    return out_path


def _wrap_pcm_to_wav(
    pcm: bytes, *, rate: int = 24000, channels: int = 1, bits: int = 16
) -> bytes:
    """raw PCM → RIFF/WAVE 헤더 포함 self-describing WAV."""
    import struct

    byte_rate = rate * channels * bits // 8
    block_align = channels * bits // 8
    return (
        b"RIFF"
        + struct.pack("<I", 36 + len(pcm))
        + b"WAVE"
        + b"fmt "
        + struct.pack(
            "<IHHIIHH", 16, 1, channels, rate, byte_rate, block_align, bits
        )
        + b"data"
        + struct.pack("<I", len(pcm))
        + pcm
    )


def _maybe_wrap_audio(data: bytes, mime: str | None) -> bytes:
    """Gemini TTS 응답이 raw PCM 이면 WAV 로 감싸 self-contained 로 만든다.

    이미 RIFF (WAV) / ID3 (MP3) / OggS / fLaC 헤더가 있으면 그대로 통과.
    """
    if not data:
        return data
    head = data[:4]
    if head in (b"RIFF", b"OggS", b"fLaC") or data[:3] == b"ID3":
        return data
    m = (mime or "").lower()
    is_pcm = (
        m.startswith("audio/l16")
        or m.startswith("audio/pcm")
        or "linear16" in m
        # mime 비어 있고 헤더도 없으면 PCM 으로 가정 (Gemini native audio 의 default)
        or m == ""
    )
    if not is_pcm:
        return data
    rate = 24000
    channels = 1
    for kv in m.split(";")[1:]:
        k, _, v = kv.strip().partition("=")
        v = v.strip()
        if k == "rate":
            try:
                rate = int(v)
            except ValueError:
                pass
        elif k == "channels":
            try:
                channels = int(v)
            except ValueError:
                pass
    return _wrap_pcm_to_wav(data, rate=rate, channels=channels)


async def tts(text_in: str, voice: str, speed: float, out_path: Path) -> Path:
    """gemini TTS native audio → WAV (self-describing).

    Gemini native audio 모델은 raw 16-bit PCM (보통 24kHz mono) 을 inline_data 로
    돌려준다. 헤더가 없는 그 바이트를 그대로 ``.mp3`` 로 저장하면 ffmpeg/Gemini
    재업로드 모두 'header missing' 으로 디코드 실패. 그래서 mime 검사 후 PCM 이면
    WAV 헤더를 prepend 한다."""

    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        # SDK SpeechConfig 는 voice_config / language_code / multi_speaker
        # 셋만 받음. speaking_rate 는 필드가 없어서 ExtraForbidden 으로 거절됨.
        # 속도 제어가 필요하면 모델이 아직 지원 안 함 → 향후 SDK 변경 시 추가.
        speech_cfg = (
            gtypes.SpeechConfig(
                voice_config=gtypes.VoiceConfig(
                    prebuilt_voice_config=gtypes.PrebuiltVoiceConfig(
                        voice_name=voice
                    )
                )
            )
            if voice
            else None
        )
        resp = c.models.generate_content(
            model=settings().model_tts,
            contents=text_in,
            config=gtypes.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=speech_cfg,
            ),
        )
        candidates = getattr(resp, "candidates", None) or []
        if not candidates:
            raise RuntimeError("Gemini TTS: empty candidates")
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                wrapped = _maybe_wrap_audio(
                    inline.data, getattr(inline, "mime_type", None)
                )
                out_path.write_bytes(wrapped)
                return len(wrapped)
        raise RuntimeError(
            f"Gemini TTS: no inline_data in response (model={settings().model_tts})"
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    log.info(
        "gemini.tts model=%s voice=%s text_len=%d (speed=%.2f requested but unsupported by current SDK)",
        settings().model_tts,
        voice or "(default)",
        len(text_in),
        speed,
    )
    async with trace(
        kind="tts",
        model=settings().model_tts,
        request_preview=text_in,
        request_meta={
            "voice": voice or None,
            "speed_requested": speed,
            "speed_supported": False,
            "text_len": len(text_in),
            "out": out_path.name,
        },
    ) as tr:
        size = await asyncio.to_thread(_call)
        tr.response_preview = f"<audio saved: {out_path.name} ({size} bytes)>"
        tr.response_meta = {"out_path": str(out_path), "out_bytes": size}
    return out_path


async def align_words_audio(audio_path: Path, text_in: str) -> list[dict]:
    """gemini audio understanding — word-level timestamps.

    응답: ``[{"word": str, "start": float, "end": float}, ...]``
    """
    prompt = await _prompts.get("align_words_audio", TRANSCRIPT=text_in)

    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        resp = c.models.generate_content(
            model=settings().model_audio,
            contents=[
                prompt,
                gtypes.Part.from_bytes(
                    data=audio_path.read_bytes(), mime_type="audio/wav"
                ),
            ],
            config={"response_mime_type": "application/json"},
        )
        return resp.text

    audio_size = audio_path.stat().st_size if audio_path.exists() else None
    async with trace(
        kind="align",
        model=settings().model_audio,
        request_preview=prompt,
        request_meta={
            "audio": audio_path.name,
            "audio_bytes": audio_size,
            "text_len": len(text_in),
        },
    ) as tr:
        raw = await asyncio.to_thread(_call)
        tr.response_preview = raw
        tr.response_meta = {"resp_len": len(raw or "")}
    import json as _json

    return _json.loads(raw)
