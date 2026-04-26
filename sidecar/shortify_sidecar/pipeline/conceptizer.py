"""섹션 텍스트 → 4비트 학습 구조 JSON.

프롬프트는 DB ``prompts`` 테이블의 ``conceptizer_system`` / ``conceptizer_user``
key 에서 로드. 변수: ``${LANG}$``, ``${TEXT}$``.
"""
from __future__ import annotations

from .. import prompts as _prompts
from . import _gemini


async def conceptize(text: str, *, lang: str = "en") -> dict:
    text = text.strip()[:12000]  # 입력 cap
    system = await _prompts.get("conceptizer_system", LANG=lang)
    user = await _prompts.get("conceptizer_user", TEXT=text)
    return await _gemini.text_json(user, system=system)
