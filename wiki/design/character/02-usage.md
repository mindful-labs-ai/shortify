# 02. 쇼리 — Usage Guide

> **Owner**: 김성곤 · **Status**: Approved · **Last Updated**: 2026-04-26 · **Source**: Brand Identity Guide v1.1 + Character Sheet v1

마스코트 **쇼리(Shori)** 의 어디에/어떻게 쓰는가 가이드. 캐릭터 정의 및 표정/포즈 키는 [01-bible](./01-bible.md). 정본 시트: [`/design/character/final/sheet/character_mascot_sheet_v1_final.png`](../../../design/character/final/sheet/character_mascot_sheet_v1_final.png).

---

## 1. 사용 시나리오 (앱 내)

캐릭터 시트 v1의 8 표정 + 4 포즈를 앱 화면에 매핑한다. 표정/포즈 키 정의는 [01-bible §6](./01-bible.md#6-표정--포즈--turnaround).

| 위치 | 표정 / 포즈 | 카피 톤 예시 |
|------|-------------|--------------|
| **온보딩** | `excited` (신나요!) | "와, 오셨네요! 오늘 한 입 시작해볼까요?" |
| **DropView (idle)** | `default` (기본) | "여기에 PDF를 톡 — 한 입 크기로 잘라드릴게요" |
| **DropView (drop hover)** | `surprise` (깜짝!) | (시각 피드백 위주, 카피 짧게) |
| **TocCheckList (목차 선택)** | `curious` (궁금해요) | "오늘은 어떤 한 입을?" |
| **JobProgressBoard (running)** | `study-start` 정적 + `default` | "쇼리가 정리하고 있어요…" |
| **JobProgressBoard (done)** | `proud` (뿌듯해요) | "정답! 잘했어요" / "와! 완벽해요" |
| **JobProgressBoard (failed)** | `disappointed` (아쉬워요) | "거의 다 왔는데… 다시 해볼까요?" |
| **VideoLibrary (empty)** | `sleepy` (졸려요) | "오늘은 뭐 배워볼까요?" |
| **중간 학습 권유 토스트** | `bite-more` (한 입만 더!) | "한 입만 더 어때요?" |
| **연속 학습 달성 (스트릭)** | `streak-flag` (연속 학습 달성!) | "14일 연속 달성! 멈추기엔 너무 멋져요" |
| **휴식 안내 / 야간 모드** | `take-break` (잠깐 쉬어가요) | "잠깐 쉬어가요 — 내일 또 만나요" |
| **CTA 응원 (학습 시작 버튼 옆)** | `cheer` (화이팅!) | "오늘도 한 입, 화이팅!" |
| **휴면 사용자 푸시 알림** | `disappointed` 또는 `sleepy` | "쇼리가 기다려요" |
| **Settings** | 사용 안 함 | (정보 화면, 산만함 방지) |

> 포즈/표정 키는 [01-bible §6](./01-bible.md#6-표정--포즈--turnaround), 카피 톤은 [brand/01-identity §4](../brand/01-identity.md#4-톤앤매너-voice--tone) 참고.

## 2. 사용 위치 (앱 외)

| 위치 | 사용 |
|------|------|
| **App Icon (macOS)** | ✅ 사용 — 캐릭터 시트 v1에서 확정. Spark coral 라운드 스퀘어 위에 쇼리 얼굴 클로즈업. 상세는 [brand/02-logo §5](../brand/02-logo.md#5-macos-앱-아이콘). |
| **스크린샷 (App Store/랜딩)** | ✅ OK — 화면 안에 자연스럽게 배치 |
| **OG / 소셜 미리보기** | ✅ OK — 우측 또는 좌측 anchor에서 손 흔들기 |
| **랜딩 페이지 hero** | ✅ OK — 메인 일러스트 |
| **푸시 알림 아이콘** | ✅ OK — 표정만 보이는 클로즈업 권장 |
| **영상 콘텐츠 본편 안** | ❌ **사용 안 함** — 학습 영상 본편은 출처/콘텐츠 신뢰성이 우선. 인트로/아웃트로에도 등장 금지. |

## 3. 크기 / 위치

| 사용 사이즈 | 권장 폭 |
|--------------|---------|
| 인라인 아이콘 (작은 안내) | 48~64px |
| 빈 상태 일러스트 | 200~280px |
| 히어로 / 마케팅 | 500~800px |
| 푸시 알림 아이콘 | 64~128px (얼굴 위주 클로즈업) |

- 텍스트 옆에 둘 때: **텍스트 baseline에 정렬**, 좌측 배치 권장.
- 배경: Cream `#FFF8F2` ~ Cloud `#F5EFE8` (저채도 위주).
- 코랄 배경 위에 쇼리를 둘 때: 본체 코랄과 배경이 겹치지 않게 **Cream 배경 박스** 또는 **다크 브라운 outline**으로 분리.

## 4. 모션 / 애니메이션

학습 톤 = **느리고 미묘하게**.

| 상황 | 모션 |
|------|------|
| 호버 | 살짝 (3~5%) 스케일업, 200ms |
| 정답/완료 | 한 번 bounce, 320ms (`clap` 표정으로 전환) |
| 스트릭 갱신 | 폭죽 + 점프 1회, 480ms (`cheer`) |
| 빈 화면 idle | (호흡 등) **사용 안 함** — 산만 |
| 꼬리 흔들기 | 240ms 1회 (호버에서만) — 루프 금지 |
| 눈 깜빡임 | 4~6초 간격 1회 — 길게 잡아 산만함 방지 |

> Brand Identity Guide v1.1 §8 To-Do의 **모션 가이드** 작업에서 곡선/타이밍 확정.

## 5. 사운드 (예정)

마스코트 등장 시점에 사운드를 매핑한다 (Brand Identity Guide v1.1 §8 To-Do):

| 모먼트 | 사운드 톤 |
|--------|-----------|
| 정답/완료 | 짧고 밝은 띵 (mint 계열 톤) |
| 스트릭 갱신 | 폭죽 한 번 (pop) |
| 오답/실패 | 부드러운 down-tone — 부정적이지 않게 |

> 정의는 별도 사운드 아이덴티티 문서에서 (TODO).

## 6. 금지 사용

- ❌ 비율 왜곡, 회전, 미러
- ❌ 비공식 컬러 적용 (그린/블루로 칠하기 금지)
- ❌ 그림자 / 네온 / 3D / 베벨 효과
- ❌ 영상 본편 안에서 사용
- ❌ 시끄러운 모션 (춤, 끊임없는 점프, 진동, 무한 루프)
- ❌ 다른 브랜드 로고와 합성
- ❌ 캐릭터 위에 텍스트 직접 겹치기 (가독성)
- ❌ 압박형 카피와 결합 ("학습 안 하면 슬퍼져요" 같은 길티 톤)

## 7. 자산 가져오기

| 사용처 | 경로 |
|--------|------|
| React UI | `src/assets/character/*.svg` (개발 인계 후) |
| 마케팅 | `/design/marketing/` 직접 export |
| 영상 컴포즈 | (영상에는 사용 안 함) |
| 푸시 알림 | macOS 알림 아이콘은 PNG 64x64 / 128x128 export |

원본 작업물: [`/design/character/`](../../../design/character/)

---

## 관련 문서

- 캐릭터 정의: [01-bible](./01-bible.md)
- 카피라이팅 톤: [brand/01-identity §4](../brand/01-identity.md#4-톤앤매너-voice--tone)
- 모션 토큰: [ui/02-tokens §5](../ui/02-tokens.md#5-motion)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | Character Sheet v1 반영 — 표정/포즈 키를 시트 라벨에 정합. App Icon 정책을 "사용 OK"로 변경 (얼굴 클로즈업) |
| 2026-04-26 | 김성곤 | Brand Identity v1.1 반영 — 사용 시나리오/모션/사운드 확정 |
| 2026-04-26 | 김성곤 | 초안 |
