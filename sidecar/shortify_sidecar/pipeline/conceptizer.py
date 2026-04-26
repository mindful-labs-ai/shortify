"""섹션 텍스트 → 4비트 학습 구조 JSON.

프롬프트는 DB ``prompts`` 테이블의 ``conceptizer_system`` / ``conceptizer_user``
key 에서 로드. 변수: ``${LANG}$``, ``${TEXT}$``.
"""
from __future__ import annotations

from .. import prompts as _prompts
from . import _gemini


async def conceptize(text: str, *, lang: str | None = None) -> dict:
    """4비트 학습 구조 추출.

    lang 미지정 시 원본 텍스트 언어를 그대로 따라가도록 'auto' 를 넘긴다.
    프롬프트 템플릿에 'auto' 가 들어가면 모델이 'detect from passage' 로 해석.
    """
    text = text.strip()[:12000]  # 입력 cap
    lang_value = lang or "auto (match the source passage's language)"
    system = await _prompts.get("conceptizer_system", LANG=lang_value)
    user = await _prompts.get("conceptizer_user", TEXT=text)
    return await _gemini.text_json(user, system=system)
