# 03. Components

> **Owner**: 김성곤 · **Status**: Approved · **Last Updated**: 2026-04-26 · **Source**: HTML 디자인 코드 (`/design/ui/shortify-html-design/`)

shadcn/ui 위에 얹은 Shortify 커스텀 컴포넌트 카탈로그. 각 항목은 **정본 JSX 파일/라인 위치**를 함께 명시한다 — React 포팅 시 동일 시그니처 유지.

> 코드 위치: `src/components/`. 화면별 적용 예는 [`screens/`](./screens/) 폴더 참고.

---

## 0. 정본 소스 매핑

| 컴포넌트 그룹 | 정본 JSX |
|----------------|----------|
| macOS chrome (Window/Sidebar/Toolbar/TrafficLights/Glass) | [`macos-window.jsx`](../../../design/ui/shortify-html-design/macos-window.jsx) |
| Main 화면 (DropZone/Library/Recent…) | [`shortify-main.jsx`](../../../design/ui/shortify-html-design/shortify-main.jsx) |
| TOC Select | [`shortify-toc-select.jsx`](../../../design/ui/shortify-html-design/shortify-toc-select.jsx) |
| Character Select | [`shortify-character-select.jsx`](../../../design/ui/shortify-html-design/shortify-character-select.jsx) |
| Generating | [`shortify-generating.jsx`](../../../design/ui/shortify-html-design/shortify-generating.jsx) |
| 개발 도구 (편집 모드) | [`tweaks-panel.jsx`](../../../design/ui/shortify-html-design/tweaks-panel.jsx) |

---

## 1. 컴포넌트 인벤토리

### 1.1 macOS Chrome (공통 셸)

| 컴포넌트 | 정본 라인 | 핵심 prop / 역할 |
|----------|-----------|-------------------|
| `MacWindow` | `macos-window.jsx:161` | `width`, `height`, `title`, `sidebar`, `children`. radius 26, 2-layer 그림자, 사이드바+툴바+컨텐츠 |
| `MacSidebar` | `macos-window.jsx:115` | 220px 고정 폭, 프로스티드 글래스 패널 (`rgba(210,225,245,0.45)` + blur 50px) |
| `MacSidebarItem` | `macos-window.jsx:91` | `label`, `selected`. 14px 도트 + 라벨 |
| `MacSidebarHeader` | `macos-window.jsx:148` | 11px / 700 / `--ink` 50% — 섹션 헤더 |
| `MacToolbar` | `macos-window.jsx:49` | 좌측 타이틀 + 우측 액션/검색 글래스 필 |
| `MacGlass` | `macos-window.jsx:11` | 리퀴드 글래스 프리미티브. `radius`, `dark`, `blur(40px) saturate(180%)`. 뱃지·툴바 필 베이스 |
| `MacTrafficLights` | `macos-window.jsx:32` | 14px 도트 3개 (`#ff736a / #febc2e / #19c332`), gap 9 |

### 1.2 Shortify Visual Building Blocks

| 컴포넌트 | 정본 라인 | 핵심 prop |
|----------|-----------|-----------|
| `Shori` (마스코트) | `shortify-main.jsx:138`, `shortify-character-select.jsx:85`, `shortify-toc-select.jsx:96`, `shortify-generating.jsx:39` | `pose`, `size`, `talking`, `withShadow` — 화면별 동작 분기 |
| `SpeechBubble` | `shortify-character-select.jsx:136`, `shortify-toc-select.jsx:149`, `shortify-generating.jsx:80` | `text` — `bubble-pop` 키프레임으로 등장 |
| `ShortifyMark` | 모든 화면 | `size` — 워드마크 SVG. 사이드바/타이틀바 좌측 |
| `Hairline` | `shortify-main.jsx:197` | `vertical` — `--hairline` 1px 분리선 |
| `TrafficLights` | `shortify-main.jsx:350` | 사이드바 상단 macOS 신호등 (자체 구현, MacTrafficLights와 별도) |
| `TitleBar` | 모든 화면 | 윈도우 상단 — TrafficLights + 워드마크 + 우측 액션 |
| `Btn` | 모든 화면 | `variant` (`primary`/`secondary`/`ghost`), `size` (`sm`/`md`/`lg`), `disabled`. **Stamp shadow 적용** |
| `Tag` (Wireframe) | `shortify-main-wireframe.jsx:91` | `strong` — 인라인 메타 태그 |
| `Chip` | `shortify-character-select.jsx:575` | 캐릭터 카드 내 인라인 라벨 |

### 1.3 화면 전이 / 단계

| 컴포넌트 | 정본 라인 | 역할 |
|----------|-----------|------|
| `StepIndicator` | TOC `:362`, Character `:347`, Generating `:254` | `active` (1~4) — 4단계 워크플로우 진행 표시. **Main = 1, TOC = 2, Character = 3, Generating = 4** |

### 1.4 Main (DropView + Library + Recent)

| 컴포넌트 | 정본 라인 | 역할 / 상태 |
|----------|-----------|--------------|
| `Sidebar` | `shortify-main.jsx:498` | `activeKey` — 좌측 네비게이션 (Library/Recent/Settings 등) |
| `SidebarItem` | `shortify-main.jsx:437` | `label`, `count`, `active`, `accent` |
| `SidebarHeader` | `shortify-main.jsx:481` | 섹션 헤더 |
| `DropZone` | `shortify-main.jsx:635` | `state` ∈ {`empty`, `dragover`, `filled`} — PDF 드롭 핵심 인터랙션 |
| `StatusPill` | `shortify-main.jsx:851` | `status` ∈ {`queued`, `running`, `done`, `failed`}, `stageLabel` |
| `Dot` / `PulsingDot` | `shortify-main.jsx:898/901` | 상태 도트 — `pulse-dot` 키프레임 |
| `ProgressBar` | `shortify-main.jsx:916`, `shortify-generating.jsx:308` | `value` 0-100, `progress-stripes` 키프레임 |
| `LibraryRow` | `shortify-main.jsx:941` | `item`, `density` ∈ {`compact`, `cozy`, `spacious`} |
| `Library` | `shortify-main.jsx:1040` | `items[]`, `density` |
| `ThumbPlaceholder` | `shortify-main.jsx:304` | `width`, `label`, `tone` — 9:16 썸네일 자리표시자 |
| `CharacterAvatar` | `shortify-main.jsx:1152` | `name`, `tone`, `size` — 라이브러리/리센트 카드용 |
| `RecentProjectCard` | `shortify-main.jsx:1185` | `item` — 하단 그리드 카드 |
| `RecentProjectsGrid` | `shortify-main.jsx:1466` | 3-column 자동 그리드 |
| `MainView` | `shortify-main.jsx:1521` | `tweaks` — 전체 조립 |

### 1.5 TOC Select (목차 선택)

| 컴포넌트 | 정본 라인 | 역할 |
|----------|-----------|------|
| `PdfSummary` | `shortify-toc-select.jsx:435` | `picks` — 좌측 PDF 메타 + 진행 카운터 (`{picks.size} / 5`) |
| `ShoriPanel` | `shortify-toc-select.jsx:595` | `picks` — 마스코트 + 단계별 카피 (empty/few/almost/full 4 버킷) |
| `PickCheckbox` | `shortify-toc-select.jsx:712` | `checked`, `disabled`, `onChange` — 커스텀 체크 |
| `SectionRow` | `shortify-toc-select.jsx:748` | `section`, `picked`, `locked`, `idx` — 단일 섹션 행 (선택 순번 표시) |
| `ChapterBlock` | `shortify-toc-select.jsx:841` | `chapter`, `picks`, `getOrder` — 챕터 그룹 |
| `TocView` | `shortify-toc-select.jsx:929` | 전체 조립 |

**비즈니스 룰**: `MAX_PICKS = 5` (`shortify-toc-select.jsx:6`). 5개 도달 시 미선택 행은 `locked` 처리.

### 1.6 Character Select (캐릭터 선택)

| 컴포넌트 | 정본 라인 | 역할 |
|----------|-----------|------|
| `CHARACTERS` 데이터 | `shortify-character-select.jsx:26` | 캐릭터 로스터 (현재 `shori` + N개) |
| `CharacterPortrait` | `shortify-character-select.jsx:650` | `character`, `picked` — 메인 일러스트 영역 |
| `CharacterCard` | `shortify-character-select.jsx:759` | `character`, `picked`, `onPick` — 카드 단위. picked 시 coral glow |
| `SideRail` | `shortify-character-select.jsx:420` | `selected` — PDF 메타 + 선택된 섹션 리스트 |
| `ShoriPanel` | `shortify-character-select.jsx:595` | `selected` — 우측 마스코트 안내 |
| `Meta` | `shortify-character-select.jsx:996` | `label`, `value` — 캐릭터 상세 |
| `CharacterSelectView` | `shortify-character-select.jsx:1029` | 전체 조립 |

### 1.7 Generating (영상 생성 중)

| 컴포넌트 | 정본 라인 | 역할 |
|----------|-----------|------|
| `PHASES` 상수 | `shortify-generating.jsx:27` | 5 페이즈 정의 — 아래 표 |
| `ProgressBar` | `shortify-generating.jsx:308` | `value` — 줄무늬 애니메이션 |
| `PhaseList` | `shortify-generating.jsx:346` | `progress` — 페이즈 리스트 (done/active/pending 3-state) |
| `GeneratingView` | `shortify-generating.jsx:418` | 전체 조립. 진행도에 따라 마스코트 대사 변경 |

**페이즈 정의** (`shortify-generating.jsx:27-33`):

| ID | 라벨 | range |
|----|------|-------|
| `read` | PDF 읽는 중 | 0–18 |
| `outline` | 스크립트 짜는 중 | 18–42 |
| `voice` | 목소리 입히는 중 | 42–68 |
| `render` | 영상 합치는 중 | 68–94 |
| `finish` | 마무리 | 94–100 |

> 백엔드 파이프라인 ([`06-pipeline`](../../prd/architecture/06-pipeline.md)) 의 9-stage 모델은 화면에서 5개 라벨로 압축 매핑한다.

### 1.8 Tweaks (개발 모드 Edit Panel)

`tweaks-panel.jsx` — 디자인 검토용. **프로덕션 빌드에서는 제외**.

| 컴포넌트 | 정본 라인 |
|----------|-----------|
| `TweaksPanel` | `:160` |
| `TweakSection / TweakRow` | `:250 / :259` |
| `TweakSlider / Toggle / Radio / Select / Text / Number / Color / Button` | `:273 ~ :414` |

각 화면 HTML의 `window.__TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{ ... }/*EDITMODE-END*/` 블록이 디폴트 값을 정의 — 호스트가 EDITMODE 마커 사이를 갱신해 디자인 토글을 영속화한다.

---

## 2. Button — 변형 / 사이즈

`Btn` 시그니처 (모든 화면 공통): `{ children, variant, size, onClick, disabled, style }`

### 2.1 Variant

| Variant | 용도 | 컬러 |
|---------|------|------|
| `primary` | 핵심 CTA (다음 단계, 영상 생성, 저장) | `coral-500` 배경 + Cream 텍스트, hover `coral-700`, focus `--shadow-coral` |
| `secondary` | 보조 액션 (취소, 뒤로) | `cream` 배경 + Ink 텍스트, `--hairline-strong` 보더, `--shadow-stamp-sm` |
| `ghost` | 인라인 액션 | 투명 배경 + Ink 텍스트, hover `coral-50` |
| `success` | 정답·완료 확인 | `mint-500` 배경 + Ink 텍스트 |
| `danger` | 삭제 | `danger` 토큰 ([color §5](../brand/03-color.md#5-시맨틱-토큰), TODO) |

**규칙**: 한 화면에 `primary`는 **하나만** ([color §3](../brand/03-color.md#3-컬러-운영-원칙)).

### 2.2 Size

| Size | 높이 | radius | shadow |
|------|------|--------|--------|
| `sm` | 28px | `radius-sm` (6) | `shadow-stamp-sm` |
| `md` (기본) | 36px | `radius-md` (10) | `shadow-stamp-md` |
| `lg` | 44px | `radius-lg` (14) | `shadow-stamp-lg` |

호버 시 stamp 오프셋 1px 감소 → "눌림" 표현.

---

## 3. DropZone (Main) — 상태 명세

`DropZone({ state })` — `shortify-main.jsx:635`.

| state | 시각 | 카피 / 아이콘 |
|-------|------|----------------|
| `empty` | 점선 보더 (`--hairline-strong` 2px dashed), Cream 배경, 마스코트 일러스트 | "여기에 PDF를 드롭하거나 클릭" + 파일 아이콘 |
| `dragover` | 코랄 보더 (`--coral-500` 2px solid), `coral-50` 배경 lift, `--shadow-coral` | "놓으면 시작!" + 마스코트 talking |
| `filled` | 보더 제거, 라이브러리 그리드로 전환 | (DropZone 자체는 사라지고 `Library` 표시) |

전이: `empty ↔ dragover` 200ms `easing-emphasis`.

---

## 4. StatusPill (Library) — 상태 명세

`StatusPill({ status, stageLabel })` — `shortify-main.jsx:851`.

| status | 도트 컬러 | 라벨 | 애니 |
|--------|-----------|------|------|
| `queued` | `--ink-faint` | "대기 중" | 정적 |
| `running` | `--coral-500` | stageLabel (예: "스크립트 짜는 중") | `pulse-dot` |
| `done` | `--mint-500` | "완료" | 정적 |
| `failed` | `--coral-700` (또는 `danger` 토큰 결정 대기) | "실패 — 재시도" | 정적 |

---

## 5. Sidebar (Main) — 카운트 / 활성

`SidebarItem({ label, count, active, accent })` — `shortify-main.jsx:437`.

- `active=true`: `--ink` 11% 배경 (`mixBlendMode: multiply`로 글래스 위에 자연스럽게)
- `count`: 우측 작은 숫자 (`--ink-faint`)
- `accent`: 좌측 4px 코랄 바 (선택적)

---

## 6. ProgressBar — 두 종류

| 사용처 | 정본 라인 | 특징 |
|--------|-----------|------|
| Library 행 (개별 잡 진행) | `shortify-main.jsx:916` | 4px 높이, coral fill, `progress-stripes` 키프레임 |
| Generating 화면 (전체 진행) | `shortify-generating.jsx:308` | 8px 높이, coral fill, 동일 키프레임 |

---

## 7. SpeechBubble — 마스코트 동반자

`SpeechBubble({ text })` — TOC/Character/Generating 공통.

- 등장 애니: `bubble-pop` (220ms `easing-emphasis`)
- 텍스트 변경 시: `bubble-text` 페이드 (텍스트만 교체, 버블 위치 유지)
- 로딩 상태: `text` 대신 도트 3개 (`bubble-dot` 키프레임 시차 적용)
- 위치: 마스코트 우상단, 꼬리는 마스코트 머리 방향

---

## 8. 인계 체크리스트 (새 컴포넌트 추가 시)

- [ ] 디자인 토큰만 사용 ([`02-tokens`](./02-tokens.md))
- [ ] 모든 상태 디자인됨 (idle/hover/active/disabled/loading/error)
- [ ] 다크모드 시안
- [ ] 정본 JSX 라인 번호를 본 문서에 추가
- [ ] 시안 파일은 `/design/ui/screens/<component>_*.png`
- [ ] 본 문서에 variant 표 추가

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | HTML 정본 동기화 — 정본 JSX 라인별 인벤토리, MacWindow/MacSidebar/MacGlass 추가, DropZone/StatusPill/StepIndicator/SpeechBubble/PHASES 명세, Btn variant×size 매트릭스 |
| 2026-04-26 | 김성곤 | 초안 |
