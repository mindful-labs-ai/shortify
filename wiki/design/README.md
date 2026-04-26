# Shortify 디자인 문서 (Index)

> 브랜드 아이덴티티 · UI 디자인 · 캐릭터 가이드 명세를 담는다.
> 원본 자산(AI/Figma/PSD/SVG)은 [`/design/`](../../design/) 작업 폴더 참고.
> 현재 적용 버전: **Brand Identity Guide v1.1** (마스코트 쇼리 / 코랄 메인 컬러 확정).

---

## 문서 구성

### 브랜드 (`brand/`)

| 번호 | 문서 | 내용 |
|------|------|------|
| 01 | [Identity](./brand/01-identity.md) | 미션 · 비전 · 톤앤매너 · 브랜드 키워드 |
| 02 | [Logo](./brand/02-logo.md) | 로고 시스템 · 클리어 스페이스 · 사용 규칙 |
| 03 | [Color](./brand/03-color.md) | 컬러 팔레트 · 사용 비율 · 접근성 (WCAG) |
| 04 | [Typography](./brand/04-typography.md) | 타이포 시스템 · 위계 · 한/영 페어링 |

### UI (`ui/`)

| 번호 | 문서 | 내용 |
|------|------|------|
| 01 | [Principles](./ui/01-principles.md) | UI 디자인 원칙 |
| 02 | [Tokens](./ui/02-tokens.md) | 디자인 토큰 (컬러 · 스페이싱 · 라운드 · stamp shadow · 모션 / **HTML 정본 동기화**) |
| 03 | [Components](./ui/03-components.md) | 컴포넌트 카탈로그 (정본 JSX 라인 매핑) |
| 04 | [Screens](./ui/screens/README.md) | 4-step 워크플로우 화면 명세 (Main / TOC / Character / Generating) |

> **정본 디자인 코드**: [`/design/ui/shortify-html-design/`](../../design/ui/shortify-html-design/) (5 HTML + 7 JSX). 스크린샷: [`/design/ui/screens/`](../../design/ui/screens/).

### 캐릭터 (`character/`)

| 번호 | 문서 | 내용 |
|------|------|------|
| 01 | [Bible](./character/01-bible.md) | 캐릭터 바이블 (성격 · 비주얼 · 세계관) |
| 02 | [Usage](./character/02-usage.md) | 사용 가이드 (포즈 · 표정 · 금지 사용) |

---

## 빠른 탐색

- **"브랜드 한 마디로?"** → [brand/01-identity](./brand/01-identity.md) (`Bite-sized learning, on auto-play`)
- **"메인 컬러 코드?"** → [brand/03-color](./brand/03-color.md) (`Spark coral #FF6B4A`)
- **"폰트 스택?"** → [brand/04-typography](./brand/04-typography.md) (Pretendard / Nunito / Inter / JetBrains Mono)
- **"버튼은 어떻게?"** → [ui/03-components](./ui/03-components.md)
- **"화면 시안 어디?"** → [ui/screens](./ui/screens/README.md) (4-step 워크플로우)
- **"HTML 정본 코드?"** → [`/design/ui/shortify-html-design/`](../../design/ui/shortify-html-design/)
- **"마스코트 누구?"** → [character/01-bible](./character/01-bible.md) (쇼리 · 레서판다)
- **"마스코트 사용 규칙?"** → [character/02-usage](./character/02-usage.md)
- **"카피라이팅 톤?"** → [brand/01-identity §4](./brand/01-identity.md#4-톤앤매너-voice--tone)
- **"로고 원본?"** → [`/design/brand/logo/`](../../design/brand/logo/)
- **"앱 아이콘 원본?"** → [`/design/marketing/app-icon/`](../../design/marketing/app-icon/)
- **"다음 작업은?"** → [05-next-steps](./05-next-steps.md)

---

## 문서 작성 규칙

각 디자인 문서 상단에는 다음 메타를 명시한다:

```yaml
Owner: 김성곤
Status: Draft | In Review | Approved
Last Updated: YYYY-MM-DD
```

- **Draft**: 작성 중. 의사결정 도구로 사용 금지.
- **In Review**: 팀 리뷰 대기.
- **Approved**: 확정. 변경 시 변경 이력에 기록.

---

## 관련 문서

- 제품/아키텍처: [`/wiki/prd/`](../prd/)
- 팀: [`/wiki/members.md`](../members.md)
- 자산 폴더: [`/design/`](../../design/)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | HTML 정본 디자인 코드 동기화 — 02-tokens / 03-components 갱신, 04-screens 신설 (Main / TOC / Character / Generating 4-step 명세) |
| 2026-04-26 | 김성곤 | Brand Identity Guide v1.1 반영 — 코랄 팔레트 / 쇼리(레서판다) 마스코트 / 폰트 스택 / 톤앤매너 확정 |
| 2026-04-26 | 김성곤 | 디자인 문서 스캐폴드 |
