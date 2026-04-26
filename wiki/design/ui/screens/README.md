# 04. Screen Specifications

> **Owner**: 김성곤 · **Status**: Approved · **Last Updated**: 2026-04-26 · **Source**: HTML 디자인 코드 (`/design/ui/shortify-html-design/`) + 스크린샷 (`/design/ui/screens/`)

Shortify의 4단계 핵심 워크플로우 화면 명세. 각 문서는 **정본 HTML/JSX 파일** + **스크린샷**을 함께 참조한다 — React 포팅 시 단일 진실 출처.

---

## 워크플로우 (Step 1 → 4)

```
┌────────────┐   PDF 드롭   ┌────────────┐   섹션 5개 선택   ┌────────────┐   캐릭터 픽   ┌────────────┐
│ 01. Main   │ ───────────▶ │ 02. TOC    │ ───────────────▶ │ 03. Char.  │ ───────────▶ │ 04. Gen.   │
│ (DropView) │              │  Select    │                  │  Select    │              │ Generating │
└────────────┘              └────────────┘                  └────────────┘              └────────────┘
   Step = 1                    Step = 2                        Step = 3                    Step = 4
```

각 화면은 좌측 `MacSidebar` + 상단 `TitleBar` + 우측 본문(StepIndicator + 컨텐츠) 레이아웃을 공유한다.

---

## 화면 인덱스

| # | 문서 | 정본 HTML | 스크린샷 |
|---|------|-----------|----------|
| 01 | [Main (DropView + Library)](./01-main.md) | [`Shortify Main.html`](../../../../design/ui/shortify-html-design/Shortify%20Main.html) | [`main-ui.png`](../../../../design/ui/screens/main-ui.png) |
| 02 | [TOC Select (목차 선택)](./02-toc-select.md) | [`Shortify TOC Select.html`](../../../../design/ui/shortify-html-design/Shortify%20TOC%20Select.html) | [`step2-ui.png`](../../../../design/ui/screens/step2-ui.png) |
| 03 | [Character Select (캐릭터 선택)](./03-character-select.md) | [`Shortify Character Select.html`](../../../../design/ui/shortify-html-design/Shortify%20Character%20Select.html) | [`step3-ui.png`](../../../../design/ui/screens/step3-ui.png) |
| 04 | [Generating (영상 생성 중)](./04-generating.md) | [`Shortify Generating.html`](../../../../design/ui/shortify-html-design/Shortify%20Generating.html) | [`step4-ui.png`](../../../../design/ui/screens/step4-ui.png) |

---

## 공통 요소

| 요소 | 위치 | 정본 |
|------|------|------|
| MacWindow (radius 26, 2-layer 그림자) | 화면 외곽 | [`macos-window.jsx:161`](../../../../design/ui/shortify-html-design/macos-window.jsx) |
| MacSidebar (220px, 글래스) | 좌측 | `macos-window.jsx:115` |
| TrafficLights (14px × 3) | 사이드바 상단 | `macos-window.jsx:32` |
| TitleBar (워드마크 + 액션) | 상단 | 각 JSX 내 `TitleBar` |
| StepIndicator | 본문 상단 | TOC/Character/Generating JSX (`active` prop) |
| Shori 마스코트 | Main HOME 좌측, TOC/Character/Generating 우측 패널 | 각 JSX `Shori` |
| Tweaks Panel (개발용) | 우상단 (프로덕션 제외) | [`tweaks-panel.jsx`](../../../../design/ui/shortify-html-design/tweaks-panel.jsx) |

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 4-step 워크플로우 화면 인덱스 + 화면별 명세 문서 분리 |
