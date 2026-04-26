# Brand Assets

> 브랜드 코어 자산 (로고 · 컬러 · 타이포). 명세는 [`/wiki/design/brand/`](../../wiki/design/brand/) 참고.

## 정본 자산 (v1)

| 자산 | 경로 | 비고 |
|------|------|------|
| **워드마크 (Primary)** | [`logo/wordmark/brand_logo_wordmark_v1_final.png`](./logo/wordmark/brand_logo_wordmark_v1_final.png) | 소문자 `shortify`, Spark coral `#FF6B4A`. SVG 분리 export 예정. |

## 하위 폴더

| 폴더 | 내용 | 명세 |
|------|------|------|
| [`logo/`](./logo/) | 로고 원본 (AI/SVG) + export (PNG @1x/2x/3x, transparent). 하위 `wordmark/` (정본) · `symbol/` (마스코트 얼굴 심볼, 예정) · `lockup/` (워드마크+마스코트, 예정) · `mono/` (단색, 예정) · `dont-do/` (금지 사용 예시, 예정) | [02-logo](../../wiki/design/brand/02-logo.md) |
| [`color/`](./color/) | 컬러 팔레트 ASE/CLR · 시안 보드 | [03-color](../../wiki/design/brand/03-color.md) |
| [`typography/`](./typography/) | 폰트 라이선스 · 샘플 · 위계 시안 | [04-typography](../../wiki/design/brand/04-typography.md) |

## 작업 시작 전 확인

1. [`01-identity`](../../wiki/design/brand/01-identity.md)에서 톤앤매너 합의 여부 확인.
2. 로고/컬러는 한 번 확정되면 **버전 업** 외에 덮어쓰지 않는다 (앱 빌드/배포 자산이 의존).
