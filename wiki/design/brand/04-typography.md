# 04. Typography

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

타이포 시스템, 위계, 한/영 페어링을 정의한다. 원본/샘플은 [`/design/brand/typography/`](../../../design/brand/typography/).

> 런타임 번들 폰트는 `assets/fonts/`(별도 폴더)에 둔다 — README의 레포 구조 참고. 본 문서는 **사용 규칙**만 다룬다.

---

## 1. 폰트 패밀리

| 용도 | 폰트 | 라이선스 |
|------|------|----------|
| 본문 (UI · 영상 자막) | **Pretendard** | OFL |
| 디스플레이 (영상 훅 · 강조 헤딩) | **Black Han Sans** (또는 TODO) | OFL |
| 영문 본문 (필요 시) | TODO (예: Inter) | TODO |
| 모노스페이스 (코드 표시) | TODO (예: JetBrains Mono) | TODO |

## 2. 위계 (Type Scale)

베이스: 16px / 1.5

| 토큰 | px | weight | line-height | 용도 |
|------|----|--------|-------------|------|
| `display-xl` | 56 | 900 | 1.1 | 영상 훅 |
| `display-lg` | 40 | 800 | 1.15 | 페이지 타이틀 |
| `heading-lg` | 28 | 700 | 1.2 | 섹션 헤딩 |
| `heading-md` | 22 | 700 | 1.3 | 카드 헤딩 |
| `heading-sm` | 18 | 600 | 1.4 | 서브 헤딩 |
| `body-lg` | 16 | 400 | 1.5 | 본문 |
| `body-md` | 14 | 400 | 1.5 | 보조 텍스트 |
| `caption` | 12 | 500 | 1.4 | 메타 정보 |
| `mono-md` | 14 | 400 | 1.5 | 코드, ID |

(TODO: 실제 디자인 검토 후 값 확정)

## 3. 한/영 페어링 규칙

- 한글 본문에 영어 단어가 섞일 때 같은 폰트 패밀리(Pretendard)로 통일.
- 영문 디스플레이는 별도 패밀리 사용 시 baseline 보정 필요.

## 4. 행간 / 자간

- 본문 한글: line-height 1.5, letter-spacing 0
- 디스플레이: line-height 1.1~1.2, letter-spacing -0.02em
- 자막 (영상): TODO

## 5. 영상 자막 사양

학습 영상의 자막은 가독성이 우선:
- 폰트: Pretendard Bold
- 사이즈: 영상 폭의 4~5%
- 외곽: 검정 outline 또는 반투명 배경 박스
- 핵심 용어: `accent-keyword` 컬러 적용 ([03-color](./03-color.md))

상세는 영상 파이프라인 [`06-pipeline`](../../prd/architecture/06-pipeline.md) 참고.

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
