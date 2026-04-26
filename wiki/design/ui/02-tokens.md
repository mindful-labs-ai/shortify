# 02. Design Tokens

> **Owner**: 김성곤 · **Status**: Approved · **Last Updated**: 2026-04-26 · **Source**: Brand Identity Guide v1.1 + HTML 디자인 코드 (`/design/ui/shortify-html-design/`)

UI 구현(`src/`)이 의존하는 토큰 정의. **정본 소스는 [`/design/ui/shortify-html-design/`](../../../design/ui/shortify-html-design/)** 5개 HTML 파일의 `:root` CSS 변수다. 코드와 이 문서가 어긋나면 정본 HTML을 기준으로 양쪽을 맞춘다.

> 컬러 토큰은 [`brand/03-color`](../brand/03-color.md), 타이포 토큰은 [`brand/04-typography`](../brand/04-typography.md) 참고. 본 문서는 **UI 구조 토큰**(spacing/radius/shadow/motion 등)을 다룬다.

---

## 0. 정본 토큰 위치

5개 HTML 모두 동일한 `:root` 블록을 공유한다 — 한 곳만 고쳐도 누락이 발생하므로 디자인 변경 시 전체 동기화 필수.

- [`Shortify Main.html`](../../../design/ui/shortify-html-design/Shortify%20Main.html)
- [`Shortify TOC Select.html`](../../../design/ui/shortify-html-design/Shortify%20TOC%20Select.html)
- [`Shortify Character Select.html`](../../../design/ui/shortify-html-design/Shortify%20Character%20Select.html)
- [`Shortify Generating.html`](../../../design/ui/shortify-html-design/Shortify%20Generating.html)
- [`Shortify Main - Wireframe.html`](../../../design/ui/shortify-html-design/Shortify%20Main%20-%20Wireframe.html)

---

## 1. Color Tokens (요약)

전체 정의는 [`brand/03-color`](../brand/03-color.md). HTML CSS 변수와 일치시켜야 하는 항목만 발췌:

```css
/* Brand */
--coral-50:#FFF1EB; --coral-100:#FFD9C9; --coral-500:#FF6B4A; --coral-700:#E04A2B; --coral-900:#993C1D;
--yellow-50:#FFF4D6; --yellow-500:#FFC83D; --yellow-900:#7A5A00;
--mint-50:#E0F7EE;   --mint-500:#5BD4A8;   --mint-900:#0F6E56;
--sky-500:#4A9BFF;

/* Warm neutrals — no pure black/white */
--ink:#1A1614; --ink-soft:#3A3431; --ink-mute:#6B6258; --ink-faint:#948A7E;
--cream:#FFF8F2; --cloud:#F5EFE8; --paper:#FBF5EE;
--warm-100:#EFE7DD; --warm-200:#E2D8CB; --warm-300:#C9BCAB;

/* Hairlines */
--hairline:rgba(26,22,20,0.08);
--hairline-strong:rgba(26,22,20,0.16);
```

> **신규 토큰** (이전 02-tokens 문서엔 없던 것): `--ink-soft / --ink-mute / --ink-faint`, `--paper`, `--warm-100/200/300`, `--hairline / --hairline-strong`.

## 2. Spacing

4px 베이스 그리드.

| 토큰 | 값 | 용도 |
|------|----|------|
| `space-0` | 0 | — |
| `space-1` | 4px | 인라인 간격 |
| `space-2` | 8px | 컴포넌트 내부 |
| `space-3` | 12px | 컴팩트 간격 |
| `space-4` | 16px | 기본 |
| `space-6` | 24px | 컴포넌트 사이 |
| `space-8` | 32px | 섹션 사이 |
| `space-12` | 48px | 페이지 패딩 |

## 3. Radius

HTML 정본에 맞춘 값 (이전 4/8/12/20 → **6/10/14/22** 로 갱신).

| 토큰 | 값 | 용도 |
|------|----|------|
| `radius-sm` | 6px | 작은 칩, 태그, Pill 인라인 |
| `radius-md` | 10px | 입력 필드, 작은 버튼 |
| `radius-lg` | 14px | 카드, 큰 버튼, DropZone 내부 |
| `radius-xl` | 22px | 모달, 큰 패널, MainView Section |
| `radius-window` | 26px | macOS 윈도우 외곽 (`MacWindow`) |
| `radius-full` | 9999px | 원형 (아바타, Pill 토글) |

## 4. Shadow

> **두 계열 병행 운영**: ① 표준 `shadow-sm/md/lg` (Ink 기반 미묘한 깊이) ② **stamp 계열** — 따뜻한 회색 단단한 그림자(2~5px 오프셋). 손으로 찍은 듯한 hand-stamped 느낌으로 버튼·카드·뱃지 하단에 사용.

### 4.1 표준 (Ink-tone)

| 토큰 | 값 | 용도 |
|------|----|------|
| `shadow-sm` | `0 1px 2px rgba(26,22,20,0.06)` | 카드 정적, hairline depth |
| `shadow-md` | `0 6px 16px rgba(26,22,20,0.08)` | 호버, 떠 있는 패널 |
| `shadow-lg` | `0 16px 40px rgba(26,22,20,0.12)` | 모달, macOS 윈도우 |

### 4.2 Stamp (hand-stamped 단단한 그림자)

```css
--stamp-soft:#C9BCAB;  /* warm-300 동일 */
--stamp-deep:#B5A693;
--shadow-stamp-sm: 2px 2px 0 var(--stamp-soft);
--shadow-stamp-md: 3px 4px 0 var(--stamp-soft);
--shadow-stamp-lg: 4px 5px 0 var(--stamp-deep);
```

**규칙**:
- 약간의 x-offset이 핵심 — 완벽 정렬되지 않은 도장 느낌.
- 호버 시 stamp 사이즈를 한 단계 줄여 "눌림" 표현 가능.
- 다크모드에서는 stamp 색을 어두운 톤으로 재정의 필요 (TODO).

### 4.3 Coral glow (CTA)

```css
--shadow-coral: 0 8px 20px rgba(255,107,74,0.25);
```

Primary CTA 버튼 hover/focus, 캐릭터 선택된 카드 외곽 등 **시선 유도**가 필요한 곳에만 사용. 한 화면에 한 군데만 권장 (60-30-10 rule).

## 5. Z-index

| 토큰 | 값 | 용도 |
|------|----|------|
| `z-base` | 0 | 기본 |
| `z-dropdown` | 100 | 드롭다운 |
| `z-overlay` | 200 | 오버레이 |
| `z-modal` | 300 | 모달 |
| `z-toast` | 400 | 토스트 |
| `z-tweaks` | 500 | 개발 모드 Tweaks 패널 |

## 6. Motion

학습 톤에 맞춰 **느리고 부드럽게**.

| 토큰 | 값 | 용도 |
|------|----|------|
| `duration-fast` | 120ms | 호버, 포커스 |
| `duration-base` | 200ms | 기본 트랜지션 |
| `duration-slow` | 320ms | 모달, 페이지 전환 |
| `easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 일반 |
| `easing-emphasis` | `cubic-bezier(0.3, 0, 0, 1)` | 진입 강조 |

### 6.1 키프레임 (HTML 정본)

| 키프레임 | 출처 화면 | 용도 |
|----------|-----------|------|
| `shori-idle` | All (talking=false) | 마스코트 정적 호흡 (4s ease) |
| `shori-talk` | All (talking=true) | 마스코트 대사 중 흔들림 |
| `shori-shadow` | TOC/Character/Generating | 마스코트 그림자 호흡 |
| `shori-pulse` | Main (HOME 마스코트) | 코랄 글로우 펄스 |
| `bubble-pop` | TOC/Character/Generating | 말풍선 등장 |
| `bubble-dot` | Loading 말풍선 | "..." 점 점프 |
| `bubble-text` | Generating | 페이즈 변경 시 텍스트 페이드 |
| `progress-stripes` | Main/Generating | 진행 줄무늬 슬라이딩 |
| `pulse-dot` | StatusPill (running) | 진행 중 도트 깜빡임 |

> 모든 키프레임의 정본 정의는 각 HTML `<style>` 블록 내. React 포팅 시 `tokens.css` 또는 Tailwind plugin으로 이동.

## 7. Background — Desktop Backdrop

앱 윈도우 뒤 데스크톱 배경 (4개 화면 공통):

```css
background:
  radial-gradient(1200px 800px at 88% -10%, #FFD9C9 0%, transparent 55%),
  radial-gradient(900px 700px at 0% 110%,  #FFE4D5 0%, transparent 50%),
  linear-gradient(180deg, #F5EBDF 0%, #ECDFCF 100%);
```

코랄 워시 + 따뜻한 크림 → 마스코트의 빨강과 자연스럽게 어우러짐.

## 8. Typography Tokens

[`brand/04-typography`](../brand/04-typography.md) 참고. HTML CSS 변수:

```css
--font-sans:    "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif;
--font-display: "Pretendard Variable", Pretendard, "Nunito", -apple-system, sans-serif;
--font-mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

> `--font-display` 가 `--font-sans` 와 분리됨 — 디스플레이 타이포에서 Nunito 폴백 보장.

## 9. Breakpoints (앱 윈도우 사이즈)

| 토큰 | 값 | 비고 |
|------|----|------|
| `min-width` | 880px | 앱 최소 폭 |
| `comfort-width` | 1100px | 권장 폭 |
| `mac-window-radius` | 26px | macOS 윈도우 외곽 라운드 |
| `mac-sidebar-width` | 220px | `MacSidebar` 고정 폭 |

## 10. 토큰 사용 매핑 (코드 인계)

| 토큰 | 코드 위치 |
|------|-----------|
| 컬러 (coral / yellow / mint / sky / ink-* / cream / cloud / paper / warm-*) | `tailwind.config.ts` `theme.extend.colors` + `src/styles/tokens.css` (CSS 변수) |
| 스페이싱/라운드 | `tailwind.config.ts` `theme.extend.{spacing, borderRadius}` |
| 타이포 (font-sans / font-display / font-mono) | `src/styles/typography.css` 또는 Tailwind plugin |
| Stamp shadow / shadow-coral | `src/styles/shadows.css` (CSS 변수 → Tailwind plugin export) |
| 모션 (duration / easing / 키프레임) | `src/styles/motion.css` |
| Desktop backdrop | `src/styles/window.css` 또는 `<body>` 스타일 |
| shadcn/ui 변수 | CSS 변수와 1:1 매핑 (`--background`, `--foreground`, `--primary` 등) |

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | HTML 정본 동기화 — radius 6/10/14/22, stamp shadow 계열, coral glow, warm/paper/ink-soft/mute/faint 토큰, font-display, desktop backdrop, 키프레임 카탈로그 추가 |
| 2026-04-26 | 김성곤 | 초안 |
