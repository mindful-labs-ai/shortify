"""Word timestamps + scene 갯수 → 컷 plan.

각 클립을 narration 박자에 맞춰 정확한 길이로 자른다.
"""
from __future__ import annotations


def plan(words: list[dict], n_clips: int) -> list[dict]:
    """반환: ``[{"clip_idx": int, "start_sec": float, "duration_sec": float}, ...]``."""
    if not words:
        # 폴백: 4초씩 균등
        return [
            {"clip_idx": i, "start_sec": i * 4.0, "duration_sec": 4.0}
            for i in range(n_clips)
        ]

    total_dur = words[-1]["end"]
    avg = total_dur / n_clips

    plans: list[dict] = []
    cursor = 0.0
    word_idx = 0
    for i in range(n_clips):
        target_end = (i + 1) * avg
        # 가장 가까운 단어 끝에 스냅
        snap_end = target_end
        while word_idx < len(words) and words[word_idx]["end"] < target_end:
            snap_end = words[word_idx]["end"]
            word_idx += 1
        if i == n_clips - 1:
            snap_end = total_dur
        plans.append(
            {
                "clip_idx": i,
                "start_sec": cursor,
                "duration_sec": max(0.5, snap_end - cursor),
            }
        )
        cursor = snap_end
    return plans
