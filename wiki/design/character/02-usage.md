# 02. Character Usage Guide

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

마스코트의 **어디에/어떻게 쓰는가** 가이드. 캐릭터 정의는 [01-bible](./01-bible.md).

---

## 1. 사용 위치 (앱 내)

| 위치 | 포즈/표정 | 용도 |
|------|-----------|------|
| DropView (idle) | `standing` + `default` | 친근한 환영 |
| DropView (drop hover) | `holding-pdf` + `surprised` | 액션 피드백 |
| TocCheckList (empty) | `pointing` + `focus` | 가이드 |
| JobProgressBoard (running) | (애니메이션 GIF/Lottie 없이 정적 2단계) | 단조롭지 않게 |
| JobProgressBoard (done) | `cheering` + `happy` | 보상 모먼트 |
| JobProgressBoard (failed) | `concerned` | 공감 |
| VideoLibrary (empty) | `waving` + `default` | 시작 유도 |
| Settings | 사용 안 함 | 정보 화면이라 산만함 방지 |

## 2. 사용 위치 (앱 외)

| 위치 | 사용 |
|------|------|
| App Icon | **사용 안 함** (앱 아이콘은 심볼 마크) |
| 스크린샷 | OK — 화면 안에서 자연스럽게 |
| OG 이미지 | OK — 우측 또는 좌측 anchor |
| 랜딩 페이지 hero | OK |
| 영상 콘텐츠 안 | **사용 안 함** (학습 영상 본편은 캐릭터 노출 금지 — 출처/콘텐츠 신뢰성 우선) |

## 3. 크기 / 위치

| 사용 사이즈 | 권장 |
|--------------|------|
| 인라인 아이콘 | 48~64px |
| 빈 상태 일러스트 | 200~280px |
| 히어로 / 마케팅 | 500~800px |

- 텍스트 옆에 둘 때: 텍스트 baseline에 정렬, 좌측 배치 권장.
- 배경: `neutral-0` ~ `neutral-50` (저채도 위주).

## 4. 모션 / 애니메이션

학습 톤 = **느리고 미묘하게**.
- 호버 시 살짝 (3~5%) 스케일업, 200ms.
- 완료 시 한 번 bounce, 320ms.
- 루프 애니메이션 (호흡 등): **사용 안 함** (산만)

## 5. 금지 사용

- ❌ 비율 왜곡, 회전, 미러
- ❌ 비공식 컬러 적용
- ❌ 그림자/네온/3D 효과
- ❌ 영상 본편 안에서 사용
- ❌ 시끄러운 모션 (춤, 점프, 진동)
- ❌ 다른 브랜드 로고와 합성
- ❌ 캐릭터에 텍스트 직접 겹치기 (가독성)

## 6. 자산 가져오기

| 사용처 | 경로 |
|--------|------|
| React UI | `src/assets/character/*.svg` (개발 인계 후) |
| 마케팅 | `/design/marketing/` 직접 export |
| 영상 컴포즈 | (영상에는 사용 안 함) |

원본 작업물: [`/design/character/`](../../../design/character/)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
