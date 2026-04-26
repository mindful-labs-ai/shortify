# Marketing Assets

> 앱 외부 노출용 자산. 명세는 별도 없음 — 본 README가 가이드.

## 하위 폴더

| 폴더 | 용도 | 필수 산출물 |
|------|------|-------------|
| [`app-icon/`](./app-icon/) | macOS 앱 아이콘 | `1024x1024.png` (마스터), `icon.icns` (빌드용) |
| [`screenshots/`](./screenshots/) | App Store / 랜딩 페이지 | `2880x1800` macOS 스크린샷 (라이트/다크) |
| [`og-images/`](./og-images/) | OG / 트위터 카드 | `1200x630.png` |

## App Icon 가이드

- macOS Big Sur+ 그릴 (rounded square 자동, **squircle 효과 포함하지 말 것**)
- 1024×1024 마스터 → `iconutil`로 `.icns` 변환
- 빌드용 `.icns`는 [`07-build-deploy`](../../wiki/prd/architecture/07-build-deploy.md) 참고

## OG / 소셜 미리보기

- 1200×630, safe area 안에 텍스트
- 우상단 또는 좌하단에 로고 고정 (브랜드 일관성)
- 다크 배경 권장 (학습 톤 = 차분함)
