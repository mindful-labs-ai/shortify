# Shortify 아키텍처 문서 (Index)

> 이 폴더는 Shortify (macOS 학습 숏폼 생성 앱)의 세분화된 아키텍처 명세를 담는다.
> 상위 기획서는 [`../plan.md`](../plan.md) 참고.

---

## 문서 구성

| 번호 | 문서 | 내용 |
|------|------|------|
| 01 | [Overview](./01-overview.md) | 시스템 한눈에 보기 · 레이어드 아키텍처 · 격리 경계 |
| 02 | [Frontend](./02-frontend.md) | React UI · 페이지 · 컴포넌트 · 상태 관리 · IPC |
| 03 | [Sidecar (Python Backend)](./03-sidecar.md) | FastAPI · asyncio queue · 워커 · 모듈 책임 |
| 04 | [Data Model](./04-data-model.md) | SQLite 스키마 · 파일시스템 레이아웃 · Keychain 키 |
| 05 | [API Spec](./05-api-spec.md) | localhost REST + SSE 엔드포인트 · 인증 · 에러 |
| 06 | [Video Pipeline](./06-pipeline.md) | Stage 0~9 상세 · 각 단계 입출력 · 외부 API 연동 |
| 07 | [Build & Deploy](./07-build-deploy.md) | PyInstaller · Tauri build · codesign · notarize · Sparkle |
| 08 | [Security](./08-security.md) | Keychain · localhost 토큰 · 파일 권한 · 외부 API 키 누출 방지 |

---

## 빠른 탐색

- **"이 코드 어디에 있지?"** → [03-sidecar](./03-sidecar.md) 또는 [02-frontend](./02-frontend.md)
- **"화면 흐름이 어떻게 돼?"** → [02-frontend](./02-frontend.md) + [06-pipeline](./06-pipeline.md)
- **"DB 스키마는?"** → [04-data-model](./04-data-model.md)
- **"API는?"** → [05-api-spec](./05-api-spec.md)
- **"빌드는 어떻게?"** → [07-build-deploy](./07-build-deploy.md)
- **"API 키는 어디 저장?"** → [08-security](./08-security.md)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | (initial) | 9개 문서 초안 |
