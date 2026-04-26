# Character Assets

> 캐릭터 작업물. 명세는 [`/wiki/design/character/`](../../wiki/design/character/) 참고.

Shortify의 **캐스트 6인** — 자산은 모두 [`cast/`](./cast/) 폴더에서 동일 구조로 관리한다. 단, _활동 무대_ 는 다르다:

- **Shori (쇼리)** — 대표 마스코트 / 앱 인격. 푸시 / 빈 화면 / 스트릭 / 앱 UI 메인. 영상에는 카메오만 (모서리 박수 등).
- **Pip · Iris · Jay · Vera · Sage** — 영상 본편 화자 (콘텐츠 인격). 앱 UI에는 Character Select에서만 등장.

마스코트 전용 마스터 자산(시트 / turnaround)은 [`final/`](./final/) 에 별도 보존.

---

## 정본 자산 (v1, 2026-04-26)

### 캐스트 6인 (정본 정면 포트레이트) — `cast/`

상세 인덱스: [`cast/README.md`](./cast/README.md).

| 캐릭터 | 역할 / 메인 컬러 | 정본 정면 |
|--------|------------------|-----------|
| **Shori** | 대표 마스코트 / coral | [`cast/shori/cast_shori_portrait_v1.png`](./cast/shori/cast_shori_portrait_v1.png) |
| Pip (12세 ENFP) | yellow | [`cast/pip/cast_pip_portrait_v1.png`](./cast/pip/cast_pip_portrait_v1.png) |
| Iris (24세 INFJ) | mint | [`cast/iris/cast_iris_portrait_v1.png`](./cast/iris/cast_iris_portrait_v1.png) |
| Jay (31세 ENTJ) | sky | [`cast/jay/cast_jay_portrait_v1.png`](./cast/jay/cast_jay_portrait_v1.png) |
| Vera (52세 ESFJ) | lavender | [`cast/vera/cast_vera_portrait_v1.png`](./cast/vera/cast_vera_portrait_v1.png) |
| Sage (71세 ISTP) | warm-gray | [`cast/sage/cast_sage_portrait_v1.png`](./cast/sage/cast_sage_portrait_v1.png) |

### 쇼리 마스코트 마스터 자산 — `final/`

쇼리는 마스코트로서 추가 마스터 자산이 필요. 5인 캐스트에는 없는 항목.

| 자산 | 경로 | 용도 |
|------|------|------|
| **캐릭터 시트 (마스터)** | [`final/sheet/character_mascot_sheet_v1_final.png`](./final/sheet/character_mascot_sheet_v1_final.png) | 표정 8종 / 포즈 4종 / 4-view turnaround / 컬러 팔레트 / 앱 아이콘 / IN USE 5종을 한 장에. 모든 디자인 결정의 시각 정본. |
| **정면 베이스 (Front)** | [`final/turnaround/character_mascot_front_v1_final.png`](./final/turnaround/character_mascot_front_v1_final.png) | 개발 인계용 단일 컷 (T-pose) |

다음 작업: 시트 PNG → 포즈/표정 단위 **SVG 분리 export** ([wiki/design/05-next-steps](../../wiki/design/05-next-steps.md) 우선순위 1) + 캐스트 5인 표정·포즈·TTS ([03-cast §8](../../wiki/design/character/03-cast.md#8-인계-체크리스트)).

---

## 하위 폴더

| 폴더 | 단계 | 내용 |
|------|------|------|
| [`concepts/`](./concepts/) | 탐색 | 컨셉 스케치, 스타일 후보, 폐기안 포함 |
| [`cast/`](./cast/) | 확정 (캐스트 6인) | 캐릭터별 폴더 — `shori/` · `pip/` · `iris/` · `jay/` · `vera/` · `sage/`. 각 폴더에 `portrait_v1` + (예정) `expressions/` · `poses/` |
| [`final/`](./final/) | 확정 (쇼리 마스터 자산) | `sheet/` (마스터) · `turnaround/` (4-view) — 마스코트 전용. 5인 캐스트는 본 폴더 사용 안 함 |
| [`references/`](./references/) | 자료 | 무드보드 · 레퍼런스 (저작권 출처 `SOURCES.md` 명시) |

## 산출물 체크리스트

### 캐스트 6인 (`cast/`)

- ✅ **portrait v1**: 6인 정면 1컷 (Shori / Pip / Iris / Jay / Vera / Sage)
- ⬜ **expressions**: 캐릭터당 8종
  - 쇼리: `default · excited · curious · surprise · proud · disappointed · sleepy · cheer`
  - 5인: `기쁨 / 놀람 / 끄덕임 / 의문 / 미소 / 진지 / 박수 / 잠깐만`
- ⬜ **poses**: 쇼리 4종 (`study-start · bite-more · streak-flag · take-break`) / 5인 5종 (`정면 / 측면 / 가리킴 / 손 흔들기 / 박수`)
- ⬜ **TTS voice**: 캐릭터별 음성 매칭 (성별 / 연령대 / 속도 / 피치)

### 쇼리 마스코트 전용 (`final/`)

- ✅ **sheet**: 마스터 시트 1장
- ✅ **turnaround base**: 정면 (3/4 / 측면 / 후면은 시트 안에 포함)
- ⬜ **scaled PNG**: 24px / 64px / 256px / 1024px (transparent)

키 정의는 [`character/01-bible §6`](../../wiki/design/character/01-bible.md#6-표정--포즈--turnaround) (쇼리) / [`character/03-cast`](../../wiki/design/character/03-cast.md) (5인 캐스트), 사용 규칙은 [`character/02-usage`](../../wiki/design/character/02-usage.md) 참고.
