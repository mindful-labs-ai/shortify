# 01. UI Design Principles

> **Owner**: 김성곤 · **Status**: Draft · **Last Updated**: 2026-04-26

Shortify 앱의 UI 디자인 원칙. 디자인 결정에서 충돌이 생기면 이 원칙으로 판단한다.

---

## 1. 학습 집중 우선 (Focus First)

UI는 학습 콘텐츠 생성을 방해하지 않는다.
- 화려한 모션 / 고채도 컬러 지양.
- 한 번에 한 가지 결정만 요구.

## 2. 진행 가시화 (Make Progress Visible)

영상 1편 생성 ETA가 ~10분이다. 사용자가 **무슨 일이 일어나고 있는지** 항상 알 수 있어야 한다.
- 단계별 진행 표시 ([`stage` 정의](../../prd/architecture/06-pipeline.md))
- 실패 시 다음 액션을 명시.

## 3. 데스크톱 네이티브 (Native Feel)

웹 페이지가 아닌 **macOS 앱**처럼 느껴져야 한다.
- macOS 키보드 단축키 (`⌘N`, `⌘W`, `⌘,`)
- 시스템 다크모드 따라가기
- macOS Big Sur+ 디자인 언어 (둥근 코너, 미묘한 그림자, hairline divider)

## 4. 작업물 중심 (Library-First)

홈은 **만든 영상**이다. 빈 라이브러리에서도 다음 액션이 명확.

## 5. 출처 가시성 (Source Transparency)

생성된 영상은 항상 **출처(PDF, 챕터, 페이지)**를 노출한다 — 학습자의 신뢰 자산.

## 6. 비용 가시화 (Cost Awareness)

API 호출 비용이 명시적으로 보여야 한다 (BYOK 사용자).
- 영상 생성 시 예상 비용 표시
- 누적 비용은 Settings에서 확인

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | 초안 |
