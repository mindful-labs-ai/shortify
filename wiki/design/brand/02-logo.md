# 02. Logo & App Icon

> **Owner**: 김성곤 · **Status**: Approved · **Last Updated**: 2026-04-26 · **Source**: Brand Identity Guide v1.1 + Logo v1 + Character Sheet v1

워드마크와 macOS 앱 아이콘의 형태, 사용 규칙, 금지 사용을 정의한다. 원본 파일은 [`/design/brand/logo/`](../../../design/brand/logo/) 및 [`/design/marketing/app-icon/`](../../../design/marketing/app-icon/).

### 정식 비주얼 자산

- **워드마크 (정본)**: [`/design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png`](../../../design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png) — 소문자 `shortify`, Spark coral `#FF6B4A`, 둥근 sans 두꺼운 인상.

---

## 1. 워드마크 (Wordmark, v1 확정)

[![shortify wordmark](../../../design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png)](../../../design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png)

- **표기**: 소문자 `shortify` — 듀오링고처럼 친근하고 비격식적인 인상.
- **폰트**: Nunito ExtraBold 베이스에 **터미널을 한층 더 둥글게 다듬은 커스텀 워드마크**. (대체 디스플레이 폰트로 사용할 때는 Nunito ExtraBold 또는 Pretendard ExtraBold).
- **자간**: 시각적으로 -2% ~ -4% 적용 — 글자가 한 덩어리로 묶여 "한 입" 느낌을 주도록.
- **컬러 (정본)**: Spark coral `#FF6B4A`. Ink `#1A1614` 또는 Cream `#FFF8F2` 단색 변형은 배경별 변형으로만 사용.
- **베이스라인**: 글자 베이스라인 평행 — 회전 / 기울임 사용 금지.
- **시각 메모**: 이중 'i' 점(dot)과 't' 의 둥근 십자가 마스코트(쇼리)의 둥근 실루엣과 톤을 맞춘다 — 워드마크와 마스코트가 같은 가족처럼 보이는 핵심 디테일.

### 최소 크기

| 매체 | 최소 폭 |
|------|---------|
| 디지털 | 96px (본문 헤더용 기본) / 24px (파비콘·인라인 한정) |
| 인쇄 | 8mm |

> 작은 사이즈에서는 글자 사이 간격이 떨어지지 않도록 **워드마크 단일 비트맵 또는 SVG로 export 후 사용** — 시스템 폰트로 재현 금지.

### 클리어 스페이스

워드마크 **높이의 0.5배**를 사방에 확보. 다른 요소가 이 영역을 침범하지 않게 한다.

## 2. 로고 변형 (Lockups)

| 변형 | 용도 | 파일 |
|------|------|------|
| Wordmark (Primary) | 일반 사용 — 헤더, 푸터, 마케팅 | ✅ [`brand_logo_wordmark_v1_final.png`](../../../design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png) — SVG export 예정 |
| Symbol-only (마스코트 얼굴) | 앱 아이콘 · 도크 · 푸시 알림 | ✅ 캐릭터 시트 v1 APP ICON 셀 — SVG 분리 예정 |
| Wordmark + Mascot lockup | 히어로 · 인트로 · 랜딩 페이지 | ⬜ 예정 (`brand_logo_lockup_v1_final.svg`) |
| Monochrome (Ink / Cream) | 단색 배경 · 인쇄 | ⬜ 예정 (`brand_logo_wordmark_mono_v1_final.svg`) |

## 3. 컬러 적용

| 배경 | 워드마크 |
|------|----------|
| Cream `#FFF8F2` | Spark coral `#FF6B4A` |
| White / 밝은 사진 | Ink `#1A1614` |
| Spark coral | Cream `#FFF8F2` |
| Dark / Ink 계열 | Cream `#FFF8F2` |
| 사진/패턴 위 | 단색 + 충분한 대비 또는 Cream 박스 사용 |

상세 컬러 코드는 [03-color](./03-color.md).

## 4. 금지 사용

- ❌ 비율 왜곡 / 회전 / 미러
- ❌ 그림자 / 네온 / 3D / 베벨 효과
- ❌ 비공식 컬러 적용 (그린/블루/퍼플 등)
- ❌ 대문자화 (`SHORTIFY` 금지)
- ❌ 자간 임의 변경 (-2~-4% 외)
- ❌ 워드마크와 심볼 분리 후 임의 재조합

(예시 이미지는 `/design/brand/logo/dont-do/`에 추가 예정)

---

## 5. macOS 앱 아이콘

> **방향 변경 (2026-04-26)**: 캐릭터 시트 v1에서 앱 아이콘의 메인 마크가 **추상 플레이 삼각형(▶)** 에서 **쇼리 얼굴 클로즈업** 으로 바뀌었다. 이유: macOS 앱 트레이/도크에서의 식별성과 브랜드 따뜻함을 동시에 잡기 위함. 마스코트가 곧 앱의 얼굴이 된다.

### 5.1 사양 (확정)

| 항목 | 값 |
|------|----|
| 캔버스 | 1024 × 1024 px |
| 외형 | 22px 라운드 스퀘어 (macOS Sonoma 가이드라인 준수) |
| 배경 | 단색 Spark coral `#FF6B4A` |
| 마크 | 가운데 **쇼리 얼굴 클로즈업** (Cream 페이스 마스크 + Dark Brown `#3A2A23` 포인트) |
| 정본 | [`/design/character/final/sheet/character_mascot_sheet_v1_final.png`](../../../design/character/final/sheet/character_mascot_sheet_v1_final.png) 의 APP ICON 셀 |

### 5.2 디자인 의도

- macOS Sonoma 이후의 **평면적이고 명확한 아이콘 트렌드**와 일치 (그림자/베벨 없이 단순 면 분리).
- 채도 낮은 에듀테크 그린/블루 사이에서 **코랄로 식별성** 확보.
- **마스코트가 앱 얼굴** — 알림, 푸시, 도크 어디서든 동일 캐릭터 → 브랜드 자산 누적 가속.
- 16px / 32px 같은 극소 사이즈에서도 얼굴의 둥근 실루엣과 두 귀의 삼각형이 살아남도록, 디테일은 최소화한다.

### 5.3 마스코트 → 아이콘 압축 규칙

| 항목 | 규칙 |
|------|------|
| 줄무늬 꼬리 | ❌ 생략 (정사각 캔버스에서 비대칭 꼬리는 시각적 노이즈) |
| 본체/팔다리 | ❌ 생략 — 얼굴(귀 끝부터 턱까지)만 노출 |
| 페이스 마스크 | ✅ 유지 — Cream 영역이 식별의 핵심 |
| 눈/코 | ✅ 유지 — Dark Brown `#3A2A23` |
| 블러쉬 | ✅ 유지 — 친근함 (단, 32px 이하 export에서는 생략 가능) |
| outline | ❌ 사용 안 함 — 면 분리만 |

### 5.4 export 사이즈 (macOS .icns)

| 용도 | px |
|------|----|
| Finder / Dock | 1024, 512, 256, 128, 64, 32, 16 |
| Retina 변형 | 위 사이즈 × 2x |
| 32px 이하 | 블러쉬 생략 / 눈을 살짝 키워 식별성 확보 (필요 시 별도 마스터) |

빌드 연동은 [`07-build-deploy`](../../prd/architecture/07-build-deploy.md). 원본은 [`/design/marketing/app-icon/`](../../../design/marketing/app-icon/).

### 5.5 일반 마스코트 사용과의 관계

앱 아이콘은 **얼굴만**, 그 외 마스코트 사용은 [`character/02-usage`](../character/02-usage.md). 헷갈리지 않게:
- 알림 아이콘 / 도크 아이콘 → 얼굴만 (이 문서)
- 온보딩 / 빈 상태 / 마케팅 → 풀바디 + 다양한 포즈 (캐릭터 가이드)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | Logo v1 도착 — 워드마크 PNG 정본 등록 (`brand_logo_wordmark_v1_final.png`), 폰트/터미널 메모 갱신, 최소 크기 96px 권장 추가 |
| 2026-04-26 | 김성곤 | Character Sheet v1 반영 — 앱 아이콘 메인 마크를 플레이 삼각형(▶) → **쇼리 얼굴 클로즈업** 으로 변경. 마스코트 → 아이콘 압축 규칙 추가 |
| 2026-04-26 | 김성곤 | Brand Identity v1.1 반영 — 워드마크 사양/앱 아이콘 컨셉 확정 |
| 2026-04-26 | 김성곤 | 초안 |
