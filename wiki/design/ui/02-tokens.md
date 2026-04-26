# 02. Design Tokens

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

UI 구현(`src/`)이 의존하는 토큰 정의. 코드와 이 문서가 어긋나면 이 문서를 기준으로 코드를 수정한다.

> 컬러 토큰은 [`brand/03-color`](../brand/03-color.md), 타이포 토큰은 [`brand/04-typography`](../brand/04-typography.md) 참고. 본 문서는 **UI 구조 토큰**을 다룬다.

---

## 1. Spacing

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

## 2. Radius

| 토큰 | 값 | 용도 |
|------|----|------|
| `radius-sm` | 4px | 작은 칩, 태그 |
| `radius-md` | 8px | 입력 필드, 버튼 |
| `radius-lg` | 12px | 카드 |
| `radius-xl` | 20px | 모달, 큰 패널 |
| `radius-full` | 9999px | 원형 (아바타) |

## 3. Shadow

macOS 스타일 — 미묘한 그림자만.

| 토큰 | 값 | 용도 |
|------|----|------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 카드 (정적) |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | 호버, 떠 있는 패널 |
| `shadow-lg` | `0 12px 32px rgba(0,0,0,0.12)` | 모달 |

## 4. Z-index

| 토큰 | 값 | 용도 |
|------|----|------|
| `z-base` | 0 | 기본 |
| `z-dropdown` | 100 | 드롭다운 |
| `z-overlay` | 200 | 오버레이 |
| `z-modal` | 300 | 모달 |
| `z-toast` | 400 | 토스트 |

## 5. Motion

학습 톤에 맞춰 **느리고 부드럽게**.

| 토큰 | 값 | 용도 |
|------|----|------|
| `duration-fast` | 120ms | 호버, 포커스 |
| `duration-base` | 200ms | 기본 트랜지션 |
| `duration-slow` | 320ms | 모달, 페이지 전환 |
| `easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 일반 |
| `easing-emphasis` | `cubic-bezier(0.3, 0, 0, 1)` | 진입 강조 |

## 6. Breakpoints (앱 윈도우 사이즈)

데스크톱 앱이지만 윈도우 리사이즈 대응:

| 토큰 | 값 | 비고 |
|------|----|------|
| `min-width` | 880px | 앱 최소 폭 |
| `comfort-width` | 1100px | 권장 폭 |

## 7. 토큰 사용 매핑

| 토큰 | 코드 위치 |
|------|-----------|
| 컬러/스페이싱/라운드 | `tailwind.config.ts` (Tailwind theme extend) |
| 타이포 | `src/styles/typography.css` (or Tailwind plugin) |
| 모션 | `src/styles/motion.css` |

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
