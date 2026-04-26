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

from ..settings import settings

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
    import time as _time

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

    t0 = _time.perf_counter()
    log.info("gemini.text_json model=%s prompt_len=%d", settings().model_text, len(prompt))
    raw = await asyncio.to_thread(_call)
    log.info("gemini.text_json done in %.2fs (resp_len=%d)", _time.perf_counter() - t0, len(raw or ""))
    try:
        return _json.loads(raw)
    except Exception as e:  # noqa: BLE001
        log.error("Gemini JSON parse failed: %s", raw[:500])
        raise RuntimeError(f"Gemini did not return valid JSON: {e}") from e


async def text(prompt: str, *, system: str | None = None) -> str:
    import time as _time

    def _call():
        c = client()
        resp = c.models.generate_content(
            model=settings().model_text,
            contents=prompt,
            config={"system_instruction": system} if system else None,
        )
        return resp.text

    t0 = _time.perf_counter()
    log.info("gemini.text model=%s prompt_len=%d", settings().model_text, len(prompt))
    out = await asyncio.to_thread(_call)
    log.info("gemini.text done in %.2fs", _time.perf_counter() - t0)
    return out


async def image(prompt: str, out_path: Path, *, ref_images: list[Path] | None = None) -> Path:
    """Imagen / gemini-image — 1장 생성 후 PNG 저장."""
    import time as _time
    def _call():
        c = client()
        contents: list[Any] = [prompt]
        if ref_images:
            from google.genai import types as gtypes  # type: ignore

            for p in ref_images:
                contents.append(gtypes.Part.from_bytes(p.read_bytes(), mime_type="image/png"))
        resp = c.models.generate_content(
            model=settings().model_image,
            contents=contents,
        )
        # SDK 응답에서 첫 번째 inline binary part 추출
        for part in resp.candidates[0].content.parts:
            if getattr(part, "inline_data", None):
                out_path.write_bytes(part.inline_data.data)
                return
        raise RuntimeError("Gemini image: no inline_data in response")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    t0 = _time.perf_counter()
    log.info("gemini.image model=%s out=%s", settings().model_image, out_path.name)
    await asyncio.to_thread(_call)
    log.info("gemini.image done in %.2fs (%s)", _time.perf_counter() - t0, out_path.name)
    return out_path


async def i2v(image_path: Path, motion_prompt: str, out_path: Path, *, duration_sec: int = 5) -> Path:
    """Veo I2V — 이미지 1장 → MP4."""
    import time as _time
    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        op = c.models.generate_videos(
            model=settings().model_video,
            prompt=motion_prompt,
            image=gtypes.Image.from_file(str(image_path)),
            config={"duration_seconds": duration_sec, "aspect_ratio": "9:16"},
        )
        # long-running operation poll
        while not op.done:
            import time

            time.sleep(5)
            op = c.operations.get(op)
        video = op.response.generated_videos[0]
        video.video.save(str(out_path))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    t0 = _time.perf_counter()
    log.info("gemini.i2v model=%s in=%s dur=%ds", settings().model_video, image_path.name, duration_sec)
    await asyncio.to_thread(_call)
    log.info("gemini.i2v done in %.2fs (%s)", _time.perf_counter() - t0, out_path.name)
    return out_path


async def tts(text_in: str, voice: str, speed: float, out_path: Path) -> Path:
    """gemini TTS native audio → MP3."""
    import time as _time
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
        for part in resp.candidates[0].content.parts:
            if getattr(part, "inline_data", None):
                out_path.write_bytes(part.inline_data.data)
                return
        raise RuntimeError("Gemini TTS: no inline_data in response")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    t0 = _time.perf_counter()
    log.info("gemini.tts model=%s voice=%s speed=%.2f text_len=%d", settings().model_tts, voice, speed, len(text_in))
    await asyncio.to_thread(_call)
    log.info("gemini.tts done in %.2fs (%s)", _time.perf_counter() - t0, out_path.name)
    return out_path


async def align_words_audio(audio_path: Path, text_in: str) -> list[dict]:
    """gemini audio understanding — word-level timestamps.

    응답: ``[{"word": str, "start": float, "end": float}, ...]``
    """
    import time as _time
    def _call():
        c = client()
        from google.genai import types as gtypes  # type: ignore

        resp = c.models.generate_content(
            model=settings().model_audio,
            contents=[
                "Return word-level timestamps for the spoken audio aligned to the "
                "transcript. Output strict JSON array of "
                '{"word": str, "start": float seconds, "end": float seconds}. '
                f"Transcript: {text_in}",
                gtypes.Part.from_bytes(audio_path.read_bytes(), mime_type="audio/mpeg"),
            ],
            config={"response_mime_type": "application/json"},
        )
        import json as _json

        return _json.loads(resp.text)

    return await asyncio.to_thread(_call)
