# UI Design Assets

> 앱 UI 디자인 작업물. 명세는 [`/wiki/design/ui/`](../../wiki/design/ui/) 참고.

## 하위 폴더

| 폴더 | 내용 |
|------|------|
| [`mockups/`](./mockups/) | 정적 화면 시안 (탐색 단계) |
| [`prototypes/`](./prototypes/) | 인터랙션/상태 전이 프로토타입 (Figma 링크 또는 export) |
| [`screens/`](./screens/) | 확정 화면 — **개발 인계 대상** |

## 화면 인벤토리 (앱 페이지 기준)

[`02-frontend`](../../wiki/prd/architecture/02-frontend.md)에 정의된 페이지 모두에 대해 시안이 필요:

- DropView
- TocCheckList
- ImageConceptPicker
- JobProgressBoard
- VideoLibrary
- Settings

각 화면은 **idle / loading / error / empty** 상태 모두 디자인한다.

## 인계 체크리스트 (`screens/` → 개발)

- [ ] 디자인 토큰([`02-tokens`](../../wiki/design/ui/02-tokens.md))과 어긋나는 컬러/스페이싱 없음
- [ ] 다크모드 / 라이트모드 둘 다 시안 존재 (필요한 경우)
- [ ] @1x / @2x / @3x export 또는 SVG 제공
- [ ] 인터랙션/상태 전이 명시 (mp4 캡쳐 또는 Figma prototype)
