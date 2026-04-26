# Character Cast — 6인

> Shortify의 모든 캐릭터(대표 마스코트 + 영상 화자)는 본 폴더에서 동일 구조로 관리한다. 명세는 [`/wiki/design/character/03-cast.md`](../../../wiki/design/character/03-cast.md). 쇼리 상세는 [`/wiki/design/character/01-bible.md`](../../../wiki/design/character/01-bible.md).

## 정본 포트레이트 (v1, 2026-04-26)

| 캐릭터 | 역할 | 메인 컬러 | 정본 |
|--------|------|-----------|------|
| **Shori** (쇼리) | 대표 마스코트 / 앱 인격 | Spark coral `#FF6B4A` | [`shori/cast_shori_portrait_v1.png`](./shori/cast_shori_portrait_v1.png) |
| **Pip** | 12세 ENFP — 호기심 메이커 | Sunny yellow `#FFC83D` | [`pip/cast_pip_portrait_v1.png`](./pip/cast_pip_portrait_v1.png) |
| **Iris** | 24세 INFJ — 사색가 | Mint green `#5BD4A8` | [`iris/cast_iris_portrait_v1.png`](./iris/cast_iris_portrait_v1.png) |
| **Jay** | 31세 ENTJ — 요약가 | Sky blue `#4A9BFF` | [`jay/cast_jay_portrait_v1.png`](./jay/cast_jay_portrait_v1.png) |
| **Vera** | 52세 ESFJ — 생활 멘토 | Lavender `#B69CE8` | [`vera/cast_vera_portrait_v1.png`](./vera/cast_vera_portrait_v1.png) |
| **Sage** | 71세 ISTP — 장인 | Warm gray `#8B7E72` | [`sage/cast_sage_portrait_v1.png`](./sage/cast_sage_portrait_v1.png) |

> **활동 무대** — 쇼리는 앱 UI(빈 화면 / 푸시 / 스트릭) 메인 + 영상 카메오, 5인은 영상 본편 화자. 쇼리의 마스터 시트·turnaround 등 마스코트 전용 자산은 [`../final/`](../final/) 에 별도 보존.

## 폴더 규칙

```
cast/
├── shori/                            ← 대표 마스코트 (앱 인격 + 영상 카메오)
│   ├── cast_shori_portrait_v1.png   ← 정본 정면 1컷
│   ├── expressions/                  ← 8종 표정 (예정)
│   └── poses/                        ← 4종 포즈 (예정)
├── pip/
│   ├── cast_pip_portrait_v1.png     ← 정본 정면 1컷
│   ├── expressions/                  ← 8종 표정 (예정)
│   └── poses/                        ← 5종 포즈 (예정)
├── iris/...
├── jay/...
├── vera/...
└── sage/...
```

## 산출물 체크리스트 (캐릭터당)

- ✅ **정면 포트레이트** — `cast_<id>_portrait_v1.png`
- ⬜ **표정 8종** — `기쁨 / 놀람 / 끄덕임 / 의문 / 미소 / 진지 / 박수 / 잠깐만`
- ⬜ **포즈 5종** — `정면 / 측면 / 가리킴 / 손 흔들기 / 박수`
- ⬜ **TTS 보이스 매칭** — 성별 / 연령대 / 속도 / 피치 (음성 라이브러리 후보 결정)
- ⬜ **scaled PNG / SVG** — Character Select UI 인계용

상세는 [`/wiki/design/character/03-cast.md`](../../../wiki/design/character/03-cast.md) §8.
