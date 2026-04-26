# Character Assets — 쇼리 (Shori)

> Shortify 마스코트 작업물. 명세는 [`/wiki/design/character/`](../../wiki/design/character/) 참고.

## 정본 자산 (v1, 2026-04-26)

| 자산 | 경로 | 용도 |
|------|------|------|
| **캐릭터 시트 (마스터)** | [`final/sheet/character_mascot_sheet_v1_final.png`](./final/sheet/character_mascot_sheet_v1_final.png) | 표정 8종 / 포즈 4종 / 4-view turnaround / 컬러 팔레트 / 앱 아이콘 / IN USE 5종을 한 장에. 모든 디자인 결정의 시각 정본. |
| **정면 베이스 (Front)** | [`final/turnaround/character_mascot_front_v1_final.png`](./final/turnaround/character_mascot_front_v1_final.png) | 개발 인계용 단일 컷 (T-pose) |

다음 작업: 시트 PNG → 포즈/표정 단위 **SVG 분리 export** ([wiki/design/05-next-steps](../../wiki/design/05-next-steps.md) 우선순위 1).

## 하위 폴더

| 폴더 | 단계 | 내용 |
|------|------|------|
| [`concepts/`](./concepts/) | 탐색 | 컨셉 스케치, 스타일 후보, 폐기안 포함 |
| [`final/`](./final/) | 확정 | 확정 캐릭터 — `sheet/` (마스터) · `turnaround/` (4-view) · `poses/` (분리 SVG, 예정) · `expressions/` (분리 SVG, 예정) |
| [`references/`](./references/) | 자료 | 무드보드 · 레퍼런스 (저작권 출처 `SOURCES.md` 명시) |

## 산출물 체크리스트

확정 캐릭터(`final/`)에는 최소한 다음을 둔다:
- ✅ **sheet**: 마스터 시트 1장
- ✅ **turnaround base**: 정면 / (3/4 / 측면 / 후면은 시트 안에 포함)
- ⬜ **expressions**: 8종 SVG 분리 export — `default · excited · curious · surprise · proud · disappointed · sleepy · cheer`
- ⬜ **poses**: 4종 SVG 분리 export — `study-start · bite-more · streak-flag · take-break`
- ⬜ **scaled PNG**: 24px / 64px / 256px / 1024px (transparent)

키 정의는 [`character/01-bible §6`](../../wiki/design/character/01-bible.md#6-표정--포즈--turnaround), 사용 규칙은 [`character/02-usage`](../../wiki/design/character/02-usage.md) 참고.
