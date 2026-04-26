# 03. Components

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

shadcn/ui 위에 얹은 Shortify 커스텀 가이드. 각 컴포넌트의 디자인 결정과 변형(variant)을 명시한다.

> 코드 위치: `src/components/`. 상세 화면 적용 예는 [`02-frontend`](../../prd/architecture/02-frontend.md) 참고.

---

## 컴포넌트 인벤토리

| 컴포넌트 | 출처 | 커스텀 정도 |
|----------|------|-------------|
| Button | shadcn/ui | 컬러/사이즈만 토큰화 |
| Input | shadcn/ui | 표준 |
| Card | shadcn/ui | radius/shadow 토큰 적용 |
| Dialog (Modal) | shadcn/ui | 표준 |
| Toast | shadcn/ui | 표준 |
| Tabs | shadcn/ui | 표준 |
| Progress | shadcn/ui | **커스텀**: 단계별 마일스톤 표시 |
| **DropZone** | 자체 | 핵심 컴포넌트 — 1.가이드 영역 강조 |
| **ImageConceptCard** | 자체 | 5종 이미지 컨셉 비교 카드 |
| **JobProgressCard** | 자체 | 영상 생성 단계별 라이브 진행 |
| **VideoPlayer** | 자체 | AVPlayer 래퍼 + 자막 토글 |

## 컴포넌트별 가이드

### Button

| Variant | 용도 | 컬러 |
|---------|------|------|
| `primary` | 핵심 CTA (영상 생성, 저장) | `brand-primary` |
| `secondary` | 보조 액션 | `neutral-100` 배경 + `neutral-900` 텍스트 |
| `ghost` | 인라인 액션 | 투명 배경 |
| `danger` | 삭제 | `danger` |

**규칙**: 한 화면에 `primary`는 **하나만**.

### DropZone

PDF 드롭 핵심 인터랙션. 상태별 디자인:

- `idle`: 점선 보더 + 캐릭터 일러스트 + "여기에 PDF 드롭"
- `hover`: `brand-primary` 보더 + 살짝 스케일업
- `error`: `danger` 보더 + 에러 메시지

(시안: TODO `/design/ui/screens/drop-view_*.png`)

### JobProgressCard

영상 생성 카드 — Stage 0~9 ([`06-pipeline`](../../prd/architecture/06-pipeline.md))를 시각화.

- 진행 중: 현재 stage 강조 + 예상 잔여 시간
- 완료: 썸네일 + 재생 버튼
- 실패: 실패 stage + 재시도 버튼

(시안: TODO)

### ImageConceptCard

5종 이미지 컨셉을 한 화면에 비교 — 사용자 선택 대기.

- 각 카드: 대표 이미지 + 짧은 컨셉 설명
- 호버: 미묘한 lift (shadow-md)
- 선택: `brand-primary` 보더 + 체크 아이콘

(시안: TODO)

---

## 인계 체크리스트

새 컴포넌트 추가 시:

- [ ] 디자인 토큰만 사용 ([`02-tokens`](./02-tokens.md))
- [ ] 모든 상태 디자인됨 (idle/hover/active/disabled/loading/error)
- [ ] 다크모드 시안
- [ ] 시안 파일은 `/design/ui/screens/<component>_*.png`
- [ ] 본 문서에 variant 표 추가

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
