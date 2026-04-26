# 04. Typography

> **Owner**: 김성곤 · **Status**: In Review · **Last Updated**: 2026-04-26 · **Source**: Brand Identity Guide v1.1

타이포 시스템, 위계, 한/영 페어링을 정의한다. 원본/샘플은 [`/design/brand/typography/`](../../../design/brand/typography/).

> 런타임 번들 폰트는 `assets/fonts/`(별도 폴더)에 둔다. 본 문서는 **사용 규칙**만 다룬다.

---

## 1. 폰트 패밀리

| 용도 | 한국어 | 영문 | 라이선스 |
|------|--------|------|----------|
| Display (헤더, 웰컴 화면) | Pretendard ExtraBold (800) | Nunito ExtraBold (800) | OFL / Google Fonts |
| Heading (카드 제목, 섹션) | Pretendard SemiBold (600) | Nunito Bold (700) | OFL / Google Fonts |
| Body | Pretendard Regular / Medium (400 / 500) | Inter 400 / 500 | OFL / Google Fonts |
| Numeric · Mono | JetBrains Mono | JetBrains Mono | Apache 2.0 |

> 디스플레이/헤딩에 Nunito · Pretendard ExtraBold 의 둥글고 두꺼운 인상을 사용해 듀오링고 'Feather Bold' 의 분위기를 차용한다.

### 폰트 라이선스 메모

- **Pretendard** — OFL, 상업 사용 OK.
- **Nunito** — Google Fonts, OFL, 상업 사용 OK.
- **Inter** — Google Fonts, OFL, 상업 사용 OK.
- **JetBrains Mono** — Apache 2.0, 상업 사용 OK.

## 2. 사이즈 스케일 (macOS 기준)

```
Display L   48 / 56  -2% letter-spacing
Display M   36 / 44  -2%
H1          28 / 36  -1%
H2          22 / 30  -0.5%
H3          18 / 26
Body L      16 / 26
Body M      14 / 22
Caption     12 / 18
Mono S      13 / 20
```

### 토큰 매핑

| 토큰 | px | line-height | weight | letter-spacing | 용도 |
|------|----|-------------|--------|----------------|------|
| `display-l` | 48 | 56 | 800 | -2% | 웰컴 화면, 영상 훅 |
| `display-m` | 36 | 44 | 800 | -2% | 페이지 타이틀 |
| `h1` | 28 | 36 | 700 | -1% | 섹션 헤딩 |
| `h2` | 22 | 30 | 700 | -0.5% | 카드 헤딩 |
| `h3` | 18 | 26 | 600 | 0 | 서브 헤딩 |
| `body-l` | 16 | 26 | 400 / 500 | 0 | 본문 |
| `body-m` | 14 | 22 | 400 / 500 | 0 | 보조 텍스트 |
| `caption` | 12 | 18 | 500 | 0 | 메타 정보 |
| `mono-s` | 13 | 20 | 400 | 0 | 카운터, 진척도, 코드 |

## 3. 한/영 페어링 규칙

- **본문**: 한국어 Pretendard + 영문 Inter (Inter는 같은 패밀리감 → baseline 자연스러움). 또는 한/영 모두 Pretendard 단일 사용 가능.
- **디스플레이**: 한국어 Pretendard ExtraBold + 영문 Nunito ExtraBold. 두 폰트 모두 둥글고 두꺼운 인상이라 **혼용 시에도 톤 일치**.
- 한 문장 안에 한국어/영어가 섞일 때는 같은 패밀리(Pretendard) 우선.
- 영문 디스플레이가 별도 패밀리일 때만 baseline·optical size 보정.

## 4. 행간 / 자간

- **본문 한글**: line-height 1.5, letter-spacing 0
- **디스플레이**: line-height 1.1~1.2, letter-spacing -2%
- **헤딩 (H1)**: letter-spacing -1%
- **자막 (영상)**: line-height 1.3, letter-spacing 0, weight 700

## 5. 샘플 카피

> **Display** — 오늘의 한 입, 3분이면 충분
>
> **Body** — 긴 강의를 AI가 60초 숏폼으로 자동 편집해주는 맥용 데스크탑 앱이에요. 짧게, 자주, 즐겁게.
>
> **Mono** — `streak · 14d  |  level · 03  |  xp · 1,240`

## 6. 영상 자막 사양

학습 영상의 자막은 가독성이 우선:

- **폰트**: Pretendard Bold (700) — Display는 사용하지 않음 (자막 가독성 우선).
- **사이즈**: 영상 폭의 4~5%.
- **외곽**: 검정 outline 또는 반투명 Ink 배경 박스.
- **핵심 용어**: `coral-500` 또는 `yellow-500` 강조 ([03-color](./03-color.md)).
- **자간**: 0 (좁히지 않는다 — 영상 압축 시 가독성 유지).

상세는 영상 파이프라인 [`06-pipeline`](../../prd/architecture/06-pipeline.md).

---

## 변경 이력

| 날짜 | 작성자 | 변경 |
|------|--------|------|
| 2026-04-26 | 김성곤 | Brand Identity v1.1 반영 — Pretendard/Nunito/Inter/JetBrains Mono 스택 확정 |
| 2026-04-26 | 김성곤 | 초안 |
