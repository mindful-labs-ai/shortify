# 03. Color System

> **Owner**: 김성곤 · **Status**: In Review · **Last Updated**: 2026-04-26 · **Source**: Brand Identity Guide v1.1

컬러 팔레트, 사용 비율, 운영 원칙, 접근성을 정의한다. 원본 ASE/CLR은 [`/design/brand/color/`](../../../design/brand/color/).

> 에듀테크에 흔한 그린·블루를 피하고 **코랄을 메인** 으로 잡았다. 듀오링고 그린의 채도감·따뜻함은 유지하되, 시장 식별성을 확보하기 위한 선택이며, 코랄은 "재생·플레이 버튼"의 상징색으로도 자연스러워 숏폼 서비스와 결이 맞는다.

---

## 1. 코어 팔레트

| 역할 | 토큰 | 이름 | HEX | RGB | 사용처 |
|------|------|------|-----|-----|--------|
| Primary | `brand-primary` | Spark coral | `#FF6B4A` | 255, 107, 74 | 로고, 주요 CTA, 브랜드 |
| Primary dark | `brand-primary-dark` | Ember | `#E04A2B` | 224, 74, 43 | hover / active 상태 |
| Accent | `accent-yellow` | Sunny yellow | `#FFC83D` | 255, 200, 61 | 스트릭, 보상, 축하 모먼트 |
| Success | `success` | Mint green | `#5BD4A8` | 91, 212, 168 | 정답, 완료, 진척도 |
| Info | `info` | Sky blue | `#4A9BFF` | 74, 155, 255 | 링크, 힌트, 정보 |
| Text | `text-base` | Ink | `#1A1614` | 26, 22, 20 | 본문, 헤딩 (순흑 대신 살짝 따뜻) |
| Surface | `surface-base` | Cream | `#FFF8F2` | 255, 248, 242 | 메인 배경 (순백 대신 따뜻한 오프화이트) |
| Subtle bg | `surface-subtle` | Cloud | `#F5EFE8` | 245, 239, 232 | 카드 위계용 옅은 배경 |
| Mascot point | `mascot-point` | Dark Brown | `#3A2A23` | 58, 42, 35 | 마스코트(쇼리) 눈 · 귀 끝 · 발 · 코. UI 본문에서는 사용 금지 — Ink와의 혼동 회피 ([character/01-bible §4](../character/01-bible.md#4-비주얼-명세)) |

## 2. 보조 셰이드 (UI 빌드용)

### Spark coral

| 토큰 | HEX | 용도 |
|------|-----|------|
| `coral-50` | `#FFF1EB` | 배경 박스 |
| `coral-100` | `#FFD9C9` | 호버 배경 |
| `coral-500` | `#FF6B4A` | primary |
| `coral-700` | `#E04A2B` | primary dark (hover/active) |
| `coral-900` | `#993C1D` | coral 위 텍스트 |

### Sunny yellow

| 토큰 | HEX | 용도 |
|------|-----|------|
| `yellow-50` | `#FFF4D6` | 축하 배경 톤 |
| `yellow-500` | `#FFC83D` | 스트릭/보상 액센트 |
| `yellow-900` | `#7A5A00` | yellow 위 텍스트 |

### Mint green

| 토큰 | HEX | 용도 |
|------|-----|------|
| `mint-50` | `#E0F7EE` | 성공 배경 |
| `mint-500` | `#5BD4A8` | 정답·완료 액센트 |
| `mint-900` | `#0F6E56` | mint 위 텍스트 |

## 3. 컬러 운영 원칙

1. **메인 코랄은 한 화면에 한 영역만** — 사용자의 눈이 가장 중요한 액션으로 향하도록.
2. **옐로우는 사용자 칭찬의 순간에만** — 스트릭 카운터, 별, 폭죽 애니메이션 등에 한정해 의미를 보존.
3. **민트는 정답 · 체크마크 전용** — "맞았다!"의 쾌감을 듀오링고 그린에서 변주.
4. **순흑 · 순백은 사용하지 않는다** — Ink와 Cream으로 통일해 전체 인상이 따뜻하게 유지.

## 4. 사용 비율 (Mood 기준)

화면을 인쇄했을 때 잉크가 차지하는 면적의 가이드:

- **65%** : Cream `#FFF8F2` / Cloud `#F5EFE8` (배경)
- **25%** : Ink `#1A1614` (텍스트, 컨테이너)
- **10%** : Spark coral + 보조 액센트 (Yellow / Mint / Sky)

## 5. 시맨틱 토큰

| 토큰 | HEX | 용도 |
|------|-----|------|
| `success` | `#5BD4A8` (Mint 500) | 정답, 완료, 토스트 |
| `warning` | `#FFC83D` (Yellow 500) | 비용 경고, 주의 |
| `danger` | TODO (코랄 계열과 충돌 회피 필요 — 진한 레드/와인 후보) | 실패, 삭제 |
| `info` | `#4A9BFF` (Sky 500) | 링크, 힌트, 안내 |

> ⚠️ `danger`가 `Spark coral`과 시각적으로 너무 가까우면 안 된다. 코랄 = 긍정적 액션(재생/CTA)이라는 의미를 보존하기 위해 `danger`는 별도 빨강(예: `#D9342B` 또는 와인 톤)으로 분리한다. 다음 시안에서 확정.

## 6. 접근성 (WCAG)

모든 텍스트/아이콘 컬러 조합은 **WCAG AA (4.5:1)** 이상.

| 전경 | 배경 | 비율 (목표) | 메모 |
|------|------|-------------|------|
| Ink `#1A1614` | Cream `#FFF8F2` | 약 16:1 ✅ | 본문 기본 |
| Ink `#1A1614` | Cloud `#F5EFE8` | 약 14:1 ✅ | 카드 배경 본문 |
| Cream `#FFF8F2` | Spark coral `#FF6B4A` | 약 3:1 ⚠️ | **AA 미달** — 큰 텍스트(18pt+) 또는 비텍스트 UI에 한정 |
| Coral 900 `#993C1D` | Cream `#FFF8F2` | 약 6:1 ✅ | 코랄 배경의 본문은 이 톤 사용 |
| Sky `#4A9BFF` | Cream `#FFF8F2` | 약 3:1 ⚠️ | 링크/큰 텍스트 한정 |

(검증 도구: https://webaim.org/resources/contrastchecker/)

> 코랄 위 본문은 흰/Cream이 아닌 `coral-900` 또는 Ink로. 작은 텍스트가 코랄 배경 위에 올라가야 하면 배경을 `coral-50` / `coral-100`으로 낮춘다.

## 7. 다크모드 매핑 (TODO — 다음 시안)

라이트모드 토큰을 다크모드 토큰에 1:1 매핑.

| 라이트 토큰 | 다크 후보 |
|-------------|-----------|
| Cream `#FFF8F2` | TODO (예: `#1A1614` 본체에 약간 갈색 더한 톤) |
| Ink `#1A1614` | TODO (Cream 변형) |
| Spark coral 500 | TODO (채도 약간 낮춰 눈부심 방지) |
| Cloud `#F5EFE8` | TODO |

상세는 다음 To-Do 항목 [`Brand Identity Guide §8`](#관련-문서)에서 진행.

## 8. 코드 적용

| 위치 | 메모 |
|------|------|
| `tailwind.config.ts` | `theme.extend.colors` 에 위 토큰을 그대로 키로. `coral`, `yellow`, `mint`, `sky`, `ink`, `cream`, `cloud`. |
| `src/styles/tokens.css` | CSS 변수로도 동일 토큰 노출 — shadcn/ui 변수 매핑용. |
| 영상 파이프라인 | 자막 핵심 용어 컬러는 `accent-keyword` (= `coral-500` 또는 `yellow-500`) — [`06-pipeline`](../../prd/architecture/06-pipeline.md) 참고. |

---

## 관련 문서

- 토큰 → UI 매핑: [ui/02-tokens](../ui/02-tokens.md)
- 마스코트 본체 컬러: [character/01-bible](../character/01-bible.md)
- 타이포 (텍스트 컬러 사용처): [04-typography](./04-typography.md)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | Character Sheet v1 반영 — Mascot point `Dark Brown #3A2A23` 토큰 추가 |
| 2026-04-26 | 김성곤 | Brand Identity v1.1 반영 — 코랄 메인 팔레트/셰이드/운영 원칙/접근성 확정 |
| 2026-04-26 | 김성곤 | 초안 |
