# UI Design Assets

> 앱 UI 디자인 작업물. 명세는 [`/wiki/design/ui/`](../../wiki/design/ui/) 참고.

## 하위 폴더

| 폴더 | 내용 |
|------|------|
| [`shortify-html-design/`](./shortify-html-design/) | **정본** HTML/JSX 디자인 코드 (4-step 워크플로우 + macOS 셸) |
| [`screens/`](./screens/) | 확정 화면 PNG 스크린샷 — **개발 인계 대상** |
| [`mockups/`](./mockups/) | 정적 화면 시안 (탐색 단계) |
| [`prototypes/`](./prototypes/) | 인터랙션/상태 전이 프로토타입 (Figma 링크 또는 export) |

## 정본 자산 (v1)

### HTML/JSX 디자인 코드 (`shortify-html-design/`)

5개 HTML이 동일한 `:root` 토큰을 공유 — 토큰 변경 시 5곳 동기화 필수. 화면별 명세는 [`/wiki/design/ui/screens/`](../../wiki/design/ui/screens/).

| Step | 화면 | HTML | JSX |
|------|------|------|-----|
| 1 | Main (DropView + Library) | `Shortify Main.html` | `shortify-main.jsx` |
| 2 | TOC Select (목차 선택) | `Shortify TOC Select.html` | `shortify-toc-select.jsx` |
| 3 | Character Select (캐릭터 선택) | `Shortify Character Select.html` | `shortify-character-select.jsx` |
| 4 | Generating (영상 생성 중) | `Shortify Generating.html` | `shortify-generating.jsx` |
| — | Wireframe (참고용) | `Shortify Main - Wireframe.html` | `shortify-main-wireframe.jsx` |
| — | macOS 셸 프리미티브 | (공통) | `macos-window.jsx` |
| — | 개발 모드 편집 패널 | (공통) | `tweaks-panel.jsx` |

### 스크린샷 (`screens/`)

| 파일 | 매핑 |
|------|------|
| `main-ui.png` | Step 1 — [01-main](../../wiki/design/ui/screens/01-main.md) |
| `step2-ui.png` | Step 2 — [02-toc-select](../../wiki/design/ui/screens/02-toc-select.md) |
| `step3-ui.png` | Step 3 — [03-character-select](../../wiki/design/ui/screens/03-character-select.md) |
| `step4-ui.png` | Step 4 — [04-generating](../../wiki/design/ui/screens/04-generating.md) |

## 화면 인벤토리 (앱 페이지 기준)

[`02-frontend`](../../wiki/prd/architecture/02-frontend.md)에 정의된 페이지 모두에 대해 시안이 필요. 4-step 핵심 워크플로우는 정본 HTML로 확정 — 그 외 페이지는 후속 작업:

- [x] DropView (Main에 통합)
- [x] TocCheckList (TOC Select)
- [x] ImageConceptPicker (Character Select로 통합)
- [x] JobProgressBoard (Generating)
- [ ] VideoLibrary (Main의 Library 영역에 부분 적용; 별도 페이지 시안 필요)
- [ ] Settings

각 화면은 **idle / loading / error / empty** 상태 모두 디자인한다.

## 인계 체크리스트 (`screens/` → 개발)

- [ ] 디자인 토큰([`02-tokens`](../../wiki/design/ui/02-tokens.md))과 어긋나는 컬러/스페이싱 없음
- [ ] 다크모드 / 라이트모드 둘 다 시안 존재 (필요한 경우)
- [ ] @1x / @2x / @3x export 또는 SVG 제공
- [ ] 인터랙션/상태 전이 명시 (mp4 캡쳐 또는 Figma prototype)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | HTML/JSX 정본 디자인 코드 + 4-step 스크린샷 등록, 화면 인벤토리 진행도 갱신 |
