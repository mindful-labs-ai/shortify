# 01. Character Bible

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

Shortify 마스코트(이름 TODO)의 성격, 비주얼, 세계관을 정의한다. 사용 규칙은 [02-usage](./02-usage.md).

---

## 1. 이름 / 정체

- **이름**: TODO
- **종(Species)**: TODO (예: 책 정령, 펭귄, 생성형 캐릭터 등)
- **역할 in 앱**: 학습자의 곁에 있는 동반자 — 진행 상황을 안내하고 빈 라이브러리에서 인사한다.

## 2. 성격

세 단어로 — TODO. 예시:
- 차분함 (학습 집중을 방해하지 않음)
- 호기심 (새 PDF가 들어오면 흥미를 보임)
- 신뢰감 (출처 인용을 강조하는 존재)

## 3. 비주얼 명세

| 요소 | 결정 | 비고 |
|------|------|------|
| 스타일 | TODO (예: 플랫 일러스트, 미니멀 라인) | |
| 컬러 | `brand-primary` 베이스 + 흰색 | [03-color](../brand/03-color.md) |
| 비율 | TODO (head:body 비율) | |
| 라인 | TODO (두께 px) | |
| 음영 | 단색 평면 / 단순 셀쉐이딩 (산만한 그라디언트 금지) | |

## 4. 세계관 / 백스토리 (선택)

캐릭터에 톤이 부여되면 카피라이팅이 일관됨.
- TODO: 한 단락 백스토리.

## 5. 표정 셋

기본 표정은 학습 톤에 맞춰 **차분한 톤**:
- `default` — 가벼운 미소
- `focus` — 진지하게 응시
- `happy` — 영상 생성 완료 시
- `surprised` — 새 PDF 드롭 시
- `concerned` — 에러 발생 시

(원본: `/design/character/final/expressions/`)

## 6. 포즈 셋

앱 내 사용 포즈:
- `standing` (기본)
- `holding-pdf` (DropView idle)
- `pointing` (가이드 / 빈 상태 안내)
- `cheering` (생성 완료)
- `waving` (앱 시작/종료)

(원본: `/design/character/final/poses/`)

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
