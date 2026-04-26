# Character Cast — 영상 화자 5인

> 영상 안에서 지식을 전달하는 인간 캐스트. 명세는 [`/wiki/design/character/03-cast.md`](../../../wiki/design/character/03-cast.md).

## 정본 포트레이트 (v1, 2026-04-26)

| 캐릭터 | 연령 / MBTI | 메인 컬러 | 정본 |
|--------|-------------|-----------|------|
| **Pip** | 12세 ENFP | Sunny yellow `#FFC83D` | [`pip/cast_pip_portrait_v1.png`](./pip/cast_pip_portrait_v1.png) |
| **Iris** | 24세 INFJ | Mint green `#5BD4A8` | [`iris/cast_iris_portrait_v1.png`](./iris/cast_iris_portrait_v1.png) |
| **Jay** | 31세 ENTJ | Sky blue `#4A9BFF` | [`jay/cast_jay_portrait_v1.png`](./jay/cast_jay_portrait_v1.png) |
| **Vera** | 52세 ESFJ | Lavender `#B69CE8` | [`vera/cast_vera_portrait_v1.png`](./vera/cast_vera_portrait_v1.png) |
| **Sage** | 71세 ISTP | Warm gray `#8B7E72` | [`sage/cast_sage_portrait_v1.png`](./sage/cast_sage_portrait_v1.png) |

> 마스코트(쇼리)는 별도 — [`../final/`](../final/).

## 폴더 규칙

```
cast/
├── pip/
│   ├── cast_pip_portrait_v1.png   ← 정본 정면 1컷
│   ├── expressions/                 ← 8종 표정 (예정)
│   └── poses/                       ← 5종 포즈 (예정)
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
