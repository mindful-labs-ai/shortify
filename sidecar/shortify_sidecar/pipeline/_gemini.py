"""google-genai 단일 클라이언트 — 모든 외부 AI 호출에 사용.

사용 model id 는 ``settings()`` 에서 주입.
TODO: SDK 스펙 확정되면 method 시그니처 미세 조정. 현재 구조는
``google-genai`` 0.3+ 의 ``Client.models.generate_*`` 패턴을 따른다.
"""

from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

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

        contents: list[Any] = [prompt]
        if ref_images:
            for p in ref_images:
                contents.append(
                    gtypes.Part.from_bytes(data=p.read_bytes(), mime_type="image/png")
                )
        resp = c.models.generate_content(
            model=settings().model_image,
            contents=contents,
            # gemini-*-image-preview 류는 IMAGE modality 명시가 필수.
            config=gtypes.GenerateContentConfig(response_modalities=["IMAGE"]),
        )
        # 응답 구조 방어: candidates / content / parts 어느 단계든 None 가능
        candidates = getattr(resp, "candidates", None) or []
        if not candidates:
            block_reason = (
                getattr(getattr(resp, "prompt_feedback", None), "block_reason", None)
            )
            raise RuntimeError(
                f"Gemini image: empty candidates"
                + (f" (blocked: {block_reason})" if block_reason else "")
            )
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                out_path.write_bytes(inline.data)
                return len(inline.data)
        # 텍스트만 돌려준 경우 본문을 노출해 디버깅
        text_dump = " | ".join(
            (getattr(p, "text", None) or "") for p in parts if getattr(p, "text", None)
        )[:300]
        raise RuntimeError(
            f"Gemini image: no inline_data in response (model={settings().model_image})"
            + (f" — text='{text_dump}'" if text_dump else "")
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    log.info("gemini.image model=%s out=%s", settings().model_image, out_path.name)
    async with trace(
        kind="image",
        model=settings().model_image,
        request_preview=prompt,
        request_meta={
            "out": out_path.name,
            "n_refs": len(ref_images or []),
            "ref_names": [p.name for p in (ref_images or [])],
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
        http_opts = gtypes.HttpOptions(
            timeout=120_000,  # ms — initial 호출 충분히 길게
            retry_options=gtypes.HttpRetryOptions(
                attempts=5,
                initial_delay=2.0,
                max_delay=30.0,
                exp_base=2.0,
                jitter=0.5,
                http_status_codes=[429, 500, 502, 503, 504],
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
                transient = any(
                    code in msg for code in ("503", "504", "UNAVAILABLE", "Deadline")
                )
                if not transient:
                    raise
                consecutive_err += 1
                if consecutive_err >= 6:  # ~30s 내내 실패면 포기
                    raise RuntimeError(
                        f"Veo polling: transient errors did not recover ({msg})"
                    ) from e
                # 지수 백오프 — 추가 대기
                _t.sleep(min(30, 2 ** consecutive_err))
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
                    if not any(s in msg for s in ("503", "504", "UNAVAILABLE", "Deadline")):
                        raise
                _t.sleep(2 ** attempt)
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


async def tts(text_in: str, voice: str, speed: float, out_path: Path) -> Path:
    """gemini TTS native audio → MP3."""

    def _call():
        c = client()
        resp = c.models.generate_content(
            model=settings().model_tts,
            contents=text_in,
            config={
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {"prebuilt_voice_config": {"voice_name": voice}},
                    "speaking_rate": speed,
                },
            },
        )
        candidates = getattr(resp, "candidates", None) or []
        if not candidates:
            raise RuntimeError("Gemini TTS: empty candidates")
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                out_path.write_bytes(inline.data)
                return len(inline.data)
        raise RuntimeError(
            f"Gemini TTS: no inline_data in response (model={settings().model_tts})"
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    log.info(
        "gemini.tts model=%s voice=%s speed=%.2f text_len=%d",
        settings().model_tts,
        voice,
        speed,
        len(text_in),
    )
    async with trace(
        kind="tts",
        model=settings().model_tts,
        request_preview=text_in,
        request_meta={
            "voice": voice,
            "speed": speed,
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
                    data=audio_path.read_bytes(), mime_type="audio/mpeg"
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
