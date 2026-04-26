# 05. Design Next Steps

> **Owner**: 김성곤 · **Status**: Open · **Last Updated**: 2026-04-26 · **Source**: Brand Identity Guide v1.1 §8

브랜드 시스템을 실제 제품으로 옮기기 위한 후속 작업. 각 항목은 끝나는 즉시 해당 문서에 반영하고 본 인덱스에서 체크한다.

---

## 우선순위 1 — 마스코트 / 코어 시각

- [x] **마스코트 베리에이션 시트** — 쇼리의 표정 8종 + 포즈 4종 + 4-view turnaround + IN USE 5 시나리오. 정본: [`/design/character/final/sheet/character_mascot_sheet_v1_final.png`](../../design/character/final/sheet/character_mascot_sheet_v1_final.png). (2026-04-26 완료, 캐릭터 시트 v1)
- [x] **마스코트 Dark Brown HEX 확정** — `#3A2A23` 으로 확정 → [03-color §1](./brand/03-color.md#1-코어-팔레트) `mascot-point` 토큰 등록 완료.
- [x] **앱 아이콘 컨셉 확정** — 플레이 삼각형(▶) → **쇼리 얼굴 클로즈업** 으로 방향 변경. [02-logo §5](./brand/02-logo.md#5-macos-앱-아이콘) 갱신.
- [ ] **마스코트 SVG / 포즈 분리 export** — 시트 PNG → 포즈/표정 단위 SVG 분리. 산출물: `/design/character/final/poses/*.svg` + `/design/character/final/expressions/*.svg`.
- [ ] **블러쉬 HEX 확정** — 현재 후보 `#FFC1B3` 검증 후 토큰 추가.
- [x] **로고 워드마크 v1 (PNG)** — [`/design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png`](../../design/brand/logo/wordmark/brand_logo_wordmark_v1_final.png) 등록 완료 (2026-04-26).
- [ ] **로고 SVG 원본 + 추가 변형** — 워드마크 SVG, Mascot Symbol-only SVG, Wordmark+Mascot Lockup, Monochrome (Ink/Cream) 변형. [02-logo §2](./brand/02-logo.md#2-로고-변형-lockups).
- [ ] **macOS 앱 아이콘 1024×1024 export** — `.icns` 빌드용 사이즈 풀 셋 (16/32/64/128/256/512/1024 + Retina). 32px 이하 별도 마스터(블러쉬 생략·눈 키움) 필요.

## 우선순위 2 — 화면 / 토큰

- [x] **macOS 앱 4-step 핵심 워크플로우 목업** — Main(DropView+Library) / TOC Select / Character Select / Generating 정본 HTML/JSX + PNG 스크린샷 등록 (2026-04-26). 산출물: [`/design/ui/shortify-html-design/`](../../design/ui/shortify-html-design/) + [`/design/ui/screens/{main,step2,step3,step4}-ui.png`](../../design/ui/screens/). 화면별 명세: [`ui/screens/`](./ui/screens/README.md).
- [ ] **잔여 화면 목업** — VideoLibrary 단독 페이지 / Settings / 실패·완료 상태 시안.
- [ ] **다크모드 컬러 매핑** — [03-color §7](./brand/03-color.md#7-다크모드-매핑-todo--다음-시안) 표 채우기 + 컴포넌트 변수 매핑.
- [ ] **`danger` 토큰 확정** — Spark coral과 시각적 충돌 회피용 빨강(예: `#D9342B` 또는 와인 톤) 결정. [03-color §5](./brand/03-color.md#5-시맨틱-토큰).
- [ ] **WCAG 실측** — [03-color §6](./brand/03-color.md#6-접근성-wcag) 표의 실측치 채우기.

## 우선순위 3 — 모션 / 사운드

- [ ] **모션 가이드** — 카드 트랜지션, 정답/오답 애니메이션, 쇼리의 미세 모션(눈 깜빡임 4~6초 / 꼬리 흔들기 240ms 등) 곡선·타이밍 확정. [character/02-usage §4](./character/02-usage.md#4-모션--애니메이션) + [ui/02-tokens §5](./ui/02-tokens.md#5-motion).
- [ ] **사운드 아이덴티티** — 정답 / 오답 / 스트릭 효과음 톤 정의 → 별도 문서 (`wiki/design/sound/`) 신설 후 BGM 라이브러리(`assets/bgm/`)와 분리 운영. [character/02-usage §5](./character/02-usage.md#5-사운드-예정).

## 우선순위 4 — 운영

- [ ] **폰트 라이선스 확인** — Pretendard (OFL) · Nunito (OFL) · Inter (OFL) · JetBrains Mono (Apache 2.0) 모두 OK. 번들 시 라이선스 파일 `assets/fonts/LICENSES/` 동봉.
- [ ] **코드 토큰 동기화** — `tailwind.config.ts` + `src/styles/tokens.css` 에 `coral / yellow / mint / sky / ink / cream / cloud` 키 반영. [ui/02-tokens §7](./ui/02-tokens.md#7-토큰-사용-매핑).
- [ ] **카피 라이브러리** — 환영/정답/오답/스트릭/푸시 알림 카피 30~50개를 `i18n/ko.json`에 정리, [brand/01-identity §4.1 원칙](./brand/01-identity.md#41-원칙) 준수.

---

## 관련 문서

- 디자인 인덱스: [README](./README.md)
- 제품 로드맵: [`/wiki/prd/plan.md`](../prd/plan.md)
- 자산 폴더: [`/design/`](../../design/)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 4-step 워크플로우 정본 HTML/JSX + 스크린샷 등록 — 메인 화면 목업 항목 완료(잔여 화면 분리), 02-tokens/03-components 정본 동기화, 04-screens 신설 |
| 2026-04-26 | 김성곤 | Logo v1 워드마크 PNG 등록 — 로고 워드마크 원본 항목 PNG 부분 완료, SVG는 후속 작업으로 분리 |
| 2026-04-26 | 김성곤 | Character Sheet v1 도착 — 마스코트 베리에이션 시트 / Dark Brown HEX / 앱 아이콘 방향 항목 완료 처리 |
| 2026-04-26 | 김성곤 | Brand Identity Guide v1.1 §8 To-Do 정리 |
