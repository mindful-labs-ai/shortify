# 02. Logo System

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

로고의 형태, 사용 규칙, 금지 사용을 정의한다. 원본 파일은 [`/design/brand/logo/`](../../../design/brand/logo/).

---

## 1. 로고 변형 (Lockups)

| 변형 | 용도 | 파일 |
|------|------|------|
| Primary (워드마크 + 심볼) | 일반 사용 | TODO `logo_primary_v1.svg` |
| Symbol-only | 앱 아이콘 · 작은 사이즈 | TODO |
| Wordmark-only | 가로폭 제한 시 | TODO |
| Monochrome (Light/Dark) | 단색 배경 | TODO |

## 2. 클리어 스페이스

로고 주변 최소 여백 = `심볼 높이의 N%`. (TODO 결정)

## 3. 최소 사이즈

| 매체 | 최소 폭 (px) |
|------|---------------|
| 디지털 | TODO (예: 24px) |
| 인쇄 | TODO |

## 4. 컬러 적용

- Primary 컬러 위에서: 흰색 단색
- Light 배경에서: Primary 컬러
- Dark 배경에서: 흰색 또는 Light 톤
- 사진/패턴 위: 단색 + 충분한 대비 또는 박스 사용

상세 컬러 코드는 [03-color](./03-color.md).

## 5. 금지 사용

- ❌ 비율 왜곡
- ❌ 회전
- ❌ 그림자/네온/3D 효과
- ❌ 비공식 컬러 적용
- ❌ 워드마크와 심볼 분리 후 임의 재조합

(예시 이미지는 `/design/brand/logo/dont-do/`에 추가 예정)

## 6. 앱 아이콘

macOS 앱 아이콘은 [marketing/app-icon](../../../design/marketing/app-icon/)에서 관리. 빌드 연동은 [`07-build-deploy`](../../prd/architecture/07-build-deploy.md).

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
