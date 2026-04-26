# 03. Color System

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

컬러 팔레트, 사용 비율, 접근성 기준을 정의한다. 원본 ASE/CLR은 [`/design/brand/color/`](../../../design/brand/color/).

---

## 1. Primary

| 토큰 | HEX | RGB | 용도 |
|------|-----|-----|------|
| `brand-primary` | TODO | TODO | 핵심 인터랙션, 로고 |
| `brand-primary-dark` | TODO | TODO | 호버/강조 |
| `brand-primary-light` | TODO | TODO | 배경 액센트 |

## 2. Neutral (Grayscale)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `neutral-0` (white) | `#FFFFFF` | 베이스 |
| `neutral-50` | TODO | 배경 톤 |
| `neutral-100` | TODO | 카드/패널 |
| `neutral-300` | TODO | 보더 |
| `neutral-500` | TODO | 보조 텍스트 |
| `neutral-700` | TODO | 본문 |
| `neutral-900` | TODO | 헤딩, 다크 베이스 |
| `neutral-1000` (black) | `#000000` | — |

## 3. Semantic

| 토큰 | HEX | 용도 |
|------|-----|------|
| `success` | TODO | 완료, 성공 토스트 |
| `warning` | TODO | 주의, 비용 경고 |
| `danger` | TODO | 실패, 삭제 |
| `info` | TODO | 안내 |

## 4. 콘텐츠 강조 (학습 톤 특화)

학습 영상/UI에서 핵심 용어 강조에 사용 — 기획서 [`plan.md`](../../prd/plan.md) 참고.

| 토큰 | HEX | 용도 |
|------|-----|------|
| `accent-keyword` | TODO | 핵심 용어 하이라이트 |
| `accent-citation` | TODO | 출처/인용 footer |

## 5. 사용 비율 (60-30-10)

- **60%** : `neutral-0` ~ `neutral-100` (배경)
- **30%** : `neutral-700` ~ `neutral-900` (텍스트, 컨테이너)
- **10%** : `brand-primary` + accent (액션, 강조)

## 6. 접근성

모든 텍스트/아이콘 컬러 조합은 **WCAG AA (4.5:1)** 이상.

| 전경 | 배경 | 비율 | 결과 |
|------|------|------|------|
| `neutral-700` | `neutral-0` | TODO | TODO |
| `brand-primary` | `neutral-0` | TODO | TODO |

(검증 도구: https://webaim.org/resources/contrastchecker/)

## 7. 다크모드

라이트모드 토큰을 다크모드 토큰에 1:1 매핑. (TODO 매핑 표)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
