# 역할 분담 — AI 협업 가이드

> 이 문서는 **AI 가 task 를 받을 때 누구의 결정을 우선시하고 어떤 작업
> 패턴에 맞춰야 하는지** 정의한다. 단순 인물 소개가 아니다.
>
> 운영 원칙:
>
> 1. AI 는 task 가 들어오면 먼저 **영역 → 담당자**를 매핑한 뒤 그 사람의
>    작업 스타일에 맞춰 산출물을 만든다.
> 2. **영역 경계를 넘는 변경**은 해당 영역 담당자와 합의 후에만 진행.
> 3. 담당자가 이미 lock 한 결정 (`wiki/prd/IDEA.md` 의 P-/I- 결정사항)
>    은 AI 가 임의로 뒤집지 않는다.
> 4. 각자의 GitHub 핸들·브랜치는 PR 생성·리뷰 요청 라우팅 기준이 된다.

---

## 영역 → 담당자 매핑

AI 가 task 를 받으면 이 표로 누구에게 PR / 질문을 라우팅할지 판단.

| 영역 | 담당자 | 보조 | AI 행동 지침 |
|------|--------|------|--------------|
| 영상 파이프라인 (`sidecar/.../pipeline/*`) | 박경선 | — | `Pipeline` Protocol 시그니처는 박경선이 정의. AI 임의 변경 금지 |
| Gemini SDK 통합 (`pipeline/_gemini.py`) | 박경선 | — | 모델 ID = `settings.py` 단일 소스. SDK 트러블 발견 시 박경선에게 즉시 reporting |
| DB 스키마 (`db/models.py`, migrations) | 박경선 | — | 신규 컬럼은 alembic revision. 기존 row 호환성 (특히 JSON 컬럼) 검증 |
| 워커 / 큐 / stage 정의 (`queue/workers.py`) | 박경선 | — | stage-aware retry / 캐시 재사용 로직 보존 |
| 사이드카 API (`api/*`) + admin endpoint | 박경선 | — | 11개 라우터 + `/admin/state` 단일 dump |
| Tauri 셸 / Keychain / 사이드카 spawn | 박경선 | 김경민 | dev/prod 분기는 `cfg!(debug_assertions)` 기준 |
| 디자인 시안 → React 통합 | 김경민 | 김성곤 | sicei 의 `design/` 자산을 메인 앱에 wire-up. 시안 변경은 김성곤 합의 |
| 브랜딩·문서·앱 번들 아이콘 | 김경민 | — | hero banner / 로고 적용 / 외부 레퍼런스 정리 |
| 사이드카 OCR / TOC 등 데이터 처리 실험 | 김경민 | 박경선 | `tests/` 또는 별도 스크립트로 검증. 본 코드 영향 시 박경선 합의 |
| 브랜드·캐릭터 정의 (`wiki/design/character/*`) | 김성곤 | — | Shori 마스코트 + 5인 캐스트의 외형/시그니처는 sicei 단독 결정 |
| UI 시안 (`design/ui/*`) | 김성곤 | 김경민 | sicei 가 PNG/HTML 목업 → 김경민이 React 통합 |
| `wiki/design/` 문서 트리 | 김성곤 | — | brand · character · color · next-steps |
| Frontend 페이지 (`src/pages/*`) | 박경선 | 김경민 + 김성곤 | API 통합·인터랙션 = 박경선 / 비주얼 폴리싱 = 김경민·김성곤 |
| Admin 대시보드 (`admin/src/*`) | 박경선 | — | `/admin/state` 폴링 패널. 추가 패널은 trace 데이터 모양에 맞춰 |
| 빌드 / 배포 (Sparkle / DMG / GHA) | 박경선 | 김경민 | v0 미정. 작업 시작 전 합의 필요 |
| 일정·우선순위·요구사항 | 강호남 | — | 결정 lock 은 PM 권한. AI 가 lock 을 뒤집는 PR 만들지 말 것 |

---

## 박경선 — Project Lead · AI / Pipeline / 통합

**GitHub**: [@gngsn](https://github.com/gngsn) (alt. `@gyeongsun`) ·
**Branch**: `sunny` · **v0 커밋 점유율**: ~73 / 95+

### 결정 권한
- AI 파이프라인 모듈 시그니처 / 호출 흐름
- Gemini API 호출 방식 (모델 ID · 프롬프트 · retry · timeout)
- DB 스키마 · 마이그레이션
- Tauri ↔ 사이드카 통합 정책 (token / Keychain / dev-prod 분기)
- 워커 · 큐 · stage 정의
- AI 진단 인프라 (`ai_traces`, admin endpoint)

### AI 가 박경선 task 를 받을 때
- **선호 패턴**: evidence-first 진단 (`sqlite3` / `ai_traces` /
  `pypdf` 직접 호출 → 결론). 추측 금지.
- **커밋 메시지**: `Symptom → Cause → Fix → Verified` 4 단. 사용자가 본
  에러 메시지를 그대로 인용.
- **테스트 우선순위**: 격리 `/tmp/shortify-*` DB 로 회귀 검증 후 본 DB 영향.
- **완성 정의**: TS / ruff lint clean + 격리 부팅으로 endpoint probe 통과.
- 전체적으로 *결정 → propagation → 검증 → commit* 루프를 끊지 않게.

### AI 가 임의 변경 금지
- `Pipeline` Protocol 메서드 시그니처
- `_gemini.py` 의 model ID 기본값 (env override 만 허용)
- soft delete 정책 (`deleted_at` 컬럼)
- stage-aware retry 분기 로직

---

## 김경민 — Design Integration · Docs · Backend Experiments

**GitHub**: [@mindfullabsGyeongminkim1](https://github.com/mindfullabsGyeongminkim1) ·
**Branch**: `gyeongmin.kim` / `feat/design-integration` · **v0 커밋 점유율**: 16 / 95+

### 결정 권한
- 디자인 시안 → React 코드로 통합하는 방식 (시안 ↔ 컴포넌트 매핑)
- 외부 문서 / 레퍼런스 정리 정책
- Tauri 앱 번들 자산 (앱 아이콘 / hero banner)
- BGM / 폰트 / 컨셉 자산 위치
- Stage 2 OCR 같은 실험 스크립트 위치 (`tests/` 또는 별도)

### AI 가 김경민 task 를 받을 때
- **선호 패턴**: sicei 가 만든 PNG/HTML 시안 → React 변환을 *최소 침습*
  으로. 박경선의 인터랙션 로직은 보존.
- **wip 커밋 OK** — `feat/design-integration` 같은 장기 브랜치에서는
  진행 상태를 wip 로 자주 commit.
- **doc 정리 시**: 외부 프로젝트 (예전 video-cli) 레퍼런스를 적극 정리해
  Shortify 단독 문서로.

### 합의 필요
- 백엔드 본 코드 변경은 박경선 합의 (워커 / API / DB). 실험은 자유.

---

## 김성곤 — Design Lead · Brand / Character / UI 시안 (via Claude Design)

**GitHub**: [@sicei](https://github.com/sicei) · **Branch**: `sicei` ·
**v0 커밋 점유율**: 6 / 95+

### 결정 권한
- 브랜드 아이덴티티 (워드마크 / 컬러 / 톤앤매너)
- 캐릭터 캐스트 — Shori 마스코트의 외형·시그니처·turnaround / 5인 캐스트
  (Pip · Iris · Jay · Vera · Sage) 의 외형·메인 컬러·MBTI·역할
- UI 시안 — main / step2 / step3 / step4 화면의 visual 결정
- `wiki/design/` 문서 트리의 모든 명세

### AI 가 김성곤 task 를 받을 때
- **선호 패턴**: Claude Design 으로 시안 → 코드 변환을 직접 수행. AI 는
  그 결과물을 (a) 메인 앱에 통합하기 위한 React 변환 보조, (b) 자산
  업로드 / 폴더 구조 정리 정도로만 도움.
- **단일 진실 소스**: 캐릭터 외형은 `wiki/design/character/01-bible.md`
  (Shori) / `03-cast.md` (5인). 이 명세를 코드 (`db/seed.py SEED`) 에
  반영하는 건 자동화 OK, *명세 자체를 AI 가 임의로 바꾸지 말 것*.

### 합의 필요
- 브랜드 컬러 / 캐릭터 외형 변경은 sicei 의 명시 승인 필요. 코드 측에서
  자동 갱신은 OK 지만 의미 변경은 금지.

---

## 강호남 — Product Manager

**GitHub**: `@hona.mind` · **Branch**: 없음 (코드 기여 없음)

### 결정 권한
- 마일스톤 / 일정 / 우선순위
- `wiki/prd/IDEA.md` 의 P-/I- 결정 lock
- 사용자 리서치 / 피드백 루프 운영
- 기능 scope 결정 (v0 / v1+ 로 미루기 등)

### AI 가 PM 영역 task 를 받을 때
- **결정 lock 을 뒤집는 PR 만들지 말 것**. 새 결정이 필요해 보이면 PM
  에게 옵션 + 트레이드오프를 제시하고 답을 기다린다.
- 일정 / scope 추정은 AI 가 단독 결정하지 않음 — 정량 수치를 제시해
  PM 이 판단하게.

---

## Cross-cutting — 합의 필요 영역

이 항목들은 *어느 한 사람의 단독 영역이 아님*. AI 가 task 를 받으면
관련된 사람 모두에게 라우팅.

| 영역 | 합의 필요한 사람들 | 이유 |
|------|-------------------|------|
| 메인 앱 페이지의 visual + interaction | 박경선 (interaction) + 김성곤 (visual) + 김경민 (integration) | 시안 ↔ 동작 충돌 시 |
| 캐릭터 외형 변경이 model prompt 에 미치는 영향 | 김성곤 (외형) + 박경선 (prompt) | identity-lock prompt 가 외형 명세를 그대로 반영해야 |
| 모델 ID 변경 | 박경선 + 강호남 | 비용·품질 트레이드오프 |
| 빌드 토폴로지 변경 (PyInstaller / Sparkle / DMG) | 박경선 + 김경민 | 자산·서명 양쪽 영향 |
| 데이터 위치 / 보안 정책 | 박경선 + 강호남 | 사용자 데이터 / Keychain |

---

## 운영 흐름 (AI 가 task 받으면)

```
사용자 task
   ▼
1) 영역 식별 (위 매핑 표)
   ▼
2) 결정 lock 확인 (wiki/prd/IDEA.md P-/I-)
   ├─ lock 위반 → PM 합의 후 진행 또는 거절
   └─ lock 안 / 자유 영역 → 다음
   ▼
3) 담당자 작업 패턴 적용
   ├─ 박경선: evidence-first 진단 + 격리 검증 + 4단 commit
   ├─ 김경민: 시안 통합 / wip 자주 commit / 외부 레퍼런스 정리
   └─ 김성곤: 시안→코드는 본인이 / AI 는 통합 보조만
   ▼
4) 영역 경계 충돌 시 cross-cutting 표 → 다중 담당자 합의
   ▼
5) 산출물 + 검증 evidence 를 commit / PR
```

---

## 기여 패턴 요약 (v0 빌드 기간)

| 멤버 | 커밋 수 | 주 영역 |
|------|---------|---------|
| 박경선 | ~73 | 백엔드 / AI / 통합 / Frontend 인터랙션 |
| 김경민 | 16 | 디자인 통합 / 문서 / branding / OCR 실험 |
| 김성곤 | 6 | 디자인 자산 / 캐릭터 / 시안 |
| 강호남 | 0 (PM) | 결정·일정·요구사항 |

세부 트레이스: [`wiki/docs/session-history.md`](./docs/session-history.md)
또는 `git shortlog -sn --all`.
