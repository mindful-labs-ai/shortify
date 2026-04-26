"""DB-backed prompt loader with ``${VAR}$`` substitution.

모든 외부 LLM 프롬프트는 ``prompts`` 테이블에 저장된다.
``UPDATE prompts SET template=... WHERE key=...`` 한 줄로 즉시 반영 (재시작 불필요).
변수 치환 패턴은 ``${VARNAME}$`` — 대문자/숫자/언더스코어만 허용.
"""
from __future__ import annotations

import logging
import re

from sqlalchemy import select

from .db.models import Prompt
from .db.session import session_factory

log = logging.getLogger("shortify.prompts")

_VAR_RE = re.compile(r"\$\{([A-Z0-9_]+)\}\$")


def render(template: str, **vars: object) -> str:
    """``${KEY}$`` 패턴을 vars 값으로 치환. 누락된 변수가 있으면 KeyError."""
    missing: list[str] = []

    def _sub(m: "re.Match[str]") -> str:
        k = m.group(1)
        if k not in vars:
            missing.append(k)
            return m.group(0)
        return str(vars[k])

    out = _VAR_RE.sub(_sub, template)
    if missing:
        raise KeyError(f"prompt variables missing: {sorted(set(missing))}")
    return out


async def load(key: str) -> str:
    """key 에 매칭되는 template 반환. 없으면 KeyError."""
    async with session_factory()() as s:
        row = (
            await s.execute(select(Prompt).where(Prompt.key == key))
        ).scalar_one_or_none()
    if row is None:
        raise KeyError(f"prompt key not found: {key}")
    return row.template


async def get(key: str, **vars: object) -> str:
    """load + render 합친 호출자 편의 함수.

    DB 가 짧은 SQLite + lru 없이 매 호출마다 fresh 로드 — 사용자가
    UPDATE 하면 다음 호출부터 즉시 반영된다.
    """
    template = await load(key)
    return render(template, **vars)
