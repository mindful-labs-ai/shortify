# 팀원 소개

> Shortify를 만드는 사람들. 역할은 실제 git 기여 패턴(2026-04-26 ~ 27 v0 빌드 기간)을 반영한다.

---

### 박경선 — Project Lead · AI / Video Pipeline / 통합

전체 시스템의 **AI 파이프라인과 통합 레이어**를 책임진다. 부트스트랩부터 v0
출시까지 가장 많은 코드 변경을 만든 코어 컨트리뷰터.

- 전체 아키텍처 설계 및 시스템 구조 정의 (Tauri 셸 + React UI + Python 사이드카 + SQLite)
- 영상 생성 파이프라인 12개 모듈 전부 구현 (`ingest_pdf`, `conceptizer`, `scene_splitter`, `image_gen`, `video_gen`, `narration_gen`, `alignment`, `rhythm_cut`, `compose`, `overlays`, `effects`, `make_mask`)
- Google Gemini API 단일 통합 — google-genai SDK 트러블슈팅 시리즈 (Veo I2V 503 / RAI / SpeechConfig / multimodal PDF) 수행
- 도메인 함수 인터페이스 (`Pipeline` Protocol) 정의 → 인프라 측 워커 디스패치가 호출
- AI 출력 품질 게이트, stage-aware retry, transient 에러 백오프
- DB 스키마 (5 테이블 + soft delete + Alembic 마이그레이션), TaskQueue Protocol + SqliteTaskQueue + WorkerPool
- 사이드카 API 11개 라우터 + admin `/admin/state` + `ai_traces` 진단 인프라
- Tauri 사이드카 spawn (dev/prod 자동 감지), Keychain 통합
- Frontend의 핵심 인터랙션 통합 — 비디오 재생, narrator picker, English 카피, stage 기반 진행, 로고 클릭 홈 동작
- GitHub: [@gngsn](https://github.com/gngsn) (alt. `@gyeongsun`)
  - Branch: `sunny`

### 김경민 — Backend Infra · Design Integration · Docs

백엔드 인프라 보강과 **디자인 자산을 코드로 통합**하는 다리 역할.

- 디자인 통합 (`feat/design-integration` 브랜치) — sicei의 시안 자산을 React UI로 통합 진행
- 외부 프로젝트 포팅 레퍼런스 정리 (문서 클린업)
- README hero banner 추가, Tauri 앱 번들 아이콘을 정식 로고로 교체
- Stage 2 OCR 전환 테스트 — 클립 PDF 페이지를 Gemini로 OCR하는 경로 검증
- PDF TOC split → downstream payload 비교 스크립트
- BGM / 폰트 / 캐릭터 컨셉 자산 추가
- Gemini 스택으로의 doc 일괄 마이그레이션 (Claude/Seedream/Seedance/ElevenLabs → Gemini)
- Gemini 모델 ID를 3.1 preview 시리즈로 갱신
- GitHub: [@mindfullabsGyeongminkim1](https://github.com/mindfullabsGyeongminkim1)
  - Branch: `gyeongmin.kim` / `feat/design-integration`

### 강호남 — Product Manager

코드 기여는 없고 PM 트랙 — 기획 결정, 일정, 우선순위 운영.

- 전체 프로젝트 관리 및 마일스톤·일정 운영
- 요구사항 정의 및 우선순위 결정 (`wiki/prd/IDEA.md`의 결정 8개를 lock)
- 사용자 리서치 및 피드백 루프 운영
- GitHub: `@hona.mind`

### 김성곤 — Design Lead · Brand / Character / UI 시안 (via Claude Design)

브랜드 정체성과 캐릭터 아이덴티티의 단일 진실 소스를 만들고, 시안을 코드로
직접 적용 가능한 산출물 형태로 인계한다.

- **Claude Design**으로 시안 → 코드 변환 후 직접 적용
- 브랜드 아이덴티티 — 워드마크 v1 final, 컬러 시스템, 톤앤매너
- 캐릭터 캐스트 v1 — **Shori (마스코트, 레서판다)** + 5인 캐스트 (Pip · Iris · Jay · Vera · Sage)
  - 각 캐릭터 정면 portrait + 마스코트 character sheet / 4-view turnaround
  - `wiki/design/character/01-bible.md` (Shori) · `03-cast.md` (5인) 명세
- UI 시안 — main / step2 / step3 / step4 화면 PNG + HTML/JSX 목업 5종
- `wiki/design/` 문서 트리 — brand · character · color · next-steps
- 마케팅 에셋 (앱 아이콘, 스크린샷)
- GitHub: [@sicei](https://github.com/sicei)
  - Branch: `sicei`

---

## 기여 패턴 요약 (v0 기간)

| 멤버 | 커밋 수 | 주 영역 |
|------|---------|---------|
| 박경선 | ~73 | 백엔드 / AI / 통합 / Frontend 인터랙션 |
| 김경민 | 16 | 디자인 통합 / 문서 / branding / OCR 테스트 |
| 김성곤 | 6 | 디자인 자산 / 캐릭터 / 시안 |
| 강호남 | 0 (PM) | 결정·일정·요구사항 |

세부는 `git shortlog -sn --all` 또는 [`docs/session-history.md`](../docs/session-history.md) 참고.
