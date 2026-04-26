# Character Assets

> 캐릭터 작업물. 명세는 [`/wiki/design/character/`](../../wiki/design/character/) 참고.

Shortify의 캐릭터는 **두 계층**:

1. **마스코트 — 쇼리(Shori)**: 앱의 인격 (브랜드). 푸시 / 빈 화면 / 스트릭 / 앱 UI 등 사용 경험에 등장. 영상 본편에는 ❌.
2. **5인 캐스트 — Pip · Iris · Jay · Vera · Sage**: 콘텐츠의 인격 (화자). 영상 안에서 지식을 전달.

---

## 정본 자산 (v1, 2026-04-26)

### 마스코트 (쇼리)

| 자산 | 경로 | 용도 |
|------|------|------|
| **캐릭터 시트 (마스터)** | [`final/sheet/character_mascot_sheet_v1_final.png`](./final/sheet/character_mascot_sheet_v1_final.png) | 표정 8종 / 포즈 4종 / 4-view turnaround / 컬러 팔레트 / 앱 아이콘 / IN USE 5종을 한 장에. 모든 디자인 결정의 시각 정본. |
| **정면 베이스 (Front)** | [`final/turnaround/character_mascot_front_v1_final.png`](./final/turnaround/character_mascot_front_v1_final.png) | 개발 인계용 단일 컷 (T-pose) |
| **포트레이트 (단일컷)** | [`final/portrait/character_mascot_portrait_v1.png`](./final/portrait/character_mascot_portrait_v1.png) | 사용 예 / OG / 푸시 알림 큰 컷 후보 |

다음 작업: 시트 PNG → 포즈/표정 단위 **SVG 분리 export** ([wiki/design/05-next-steps](../../wiki/design/05-next-steps.md) 우선순위 1).

### 5인 캐스트

상세 인덱스: [`cast/README.md`](./cast/README.md).

| 캐릭터 | 정본 정면 |
|--------|-----------|
| Pip (12세 ENFP, yellow) | [`cast/pip/cast_pip_portrait_v1.png`](./cast/pip/cast_pip_portrait_v1.png) |
| Iris (24세 INFJ, mint) | [`cast/iris/cast_iris_portrait_v1.png`](./cast/iris/cast_iris_portrait_v1.png) |
| Jay (31세 ENTJ, sky) | [`cast/jay/cast_jay_portrait_v1.png`](./cast/jay/cast_jay_portrait_v1.png) |
| Vera (52세 ESFJ, lavender) | [`cast/vera/cast_vera_portrait_v1.png`](./cast/vera/cast_vera_portrait_v1.png) |
| Sage (71세 ISTP, warm-gray) | [`cast/sage/cast_sage_portrait_v1.png`](./cast/sage/cast_sage_portrait_v1.png) |

다음 작업: 캐스트 표정 8종 / 포즈 5종 / TTS 보이스 매칭 ([03-cast §8](../../wiki/design/character/03-cast.md#8-인계-체크리스트)).

---

## 하위 폴더

| 폴더 | 단계 | 내용 |
|------|------|------|
| [`concepts/`](./concepts/) | 탐색 | 컨셉 스케치, 스타일 후보, 폐기안 포함 |
| [`final/`](./final/) | 확정 (마스코트) | `sheet/` (마스터) · `turnaround/` (4-view) · `portrait/` (단일컷) · `poses/` · `expressions/` (예정) |
| [`cast/`](./cast/) | 확정 (캐스트 5인) | 캐릭터별 폴더 — `pip/` · `iris/` · `jay/` · `vera/` · `sage/`. 각 폴더에 `portrait_v1` + (예정) `expressions/` · `poses/` |
| [`references/`](./references/) | 자료 | 무드보드 · 레퍼런스 (저작권 출처 `SOURCES.md` 명시) |

## 산출물 체크리스트

### 마스코트 (`final/`)

- ✅ **sheet**: 마스터 시트 1장
- ✅ **turnaround base**: 정면 (3/4 / 측면 / 후면은 시트 안에 포함)
- ✅ **portrait**: 단일 컷 v1
- ⬜ **expressions**: 8종 SVG 분리 — `default · excited · curious · surprise · proud · disappointed · sleepy · cheer`
- ⬜ **poses**: 4종 SVG 분리 — `study-start · bite-more · streak-flag · take-break`
- ⬜ **scaled PNG**: 24px / 64px / 256px / 1024px (transparent)

### 캐스트 (`cast/`)

- ✅ **portrait v1**: 5인 정면 1컷 (Pip / Iris / Jay / Vera / Sage)
- ⬜ **expressions**: 캐릭터당 8종 (`기쁨 / 놀람 / 끄덕임 / 의문 / 미소 / 진지 / 박수 / 잠깐만`)
- ⬜ **poses**: 캐릭터당 5종 (`정면 / 측면 / 가리킴 / 손 흔들기 / 박수`)
- ⬜ **TTS voice**: 캐릭터별 음성 매칭 (성별 / 연령대 / 속도 / 피치)

키 정의는 [`character/01-bible §6`](../../wiki/design/character/01-bible.md#6-표정--포즈--turnaround) (마스코트) / [`character/03-cast`](../../wiki/design/character/03-cast.md) (캐스트), 사용 규칙은 [`character/02-usage`](../../wiki/design/character/02-usage.md) 참고.
