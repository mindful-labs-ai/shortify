# Shortify 기획안

> **슬로건**: Turn knowledge into short-form videos for faster learning
> **한 줄 요약**: 지식 자료(아티클·논문·강의 노트·영상)를 30~60초 세로 학습 영상으로 자동 변환하는 파이프라인.

---

## 핵심 추천

**`shortify`를 신규 독립 레포로 구성**하고, 브랜드 중립 코어 위에 교육형 프로필을 얹는 구조로 빌드한다.

- 아키텍처는 "브랜드 중립 코어 + per-brand 프로필" (`AGENTS.md`에 레이어드 머지 순서 명시).
- 영상 스택은 `gemini-3.1-flash-image-preview` → `veo-3.1-generate-preview` → `gemini-3.1-flash-tts-preview` → `gemini-3.1-flash-preview` (정렬) → 리듬 컷 → 9:16 컴포즈.
- 새 작업 두 가지:
  1. **지식 인제스트** (PDF / URL / 마크다운 / 유튜브 자막 → 정제 텍스트)
  2. **교육형 비주얼 스타일** (다이어그램·키워드 강조)

---

## 컨셉 정의

| 항목       | 내용                                                                |
| ---------- | ------------------------------------------------------------------- |
| **입력**   | URL · PDF · 마크다운 노트 · 원문 텍스트 · 유튜브 자막 중 하나       |
| **출력**   | 30~60초 세로 영상 (1080×1920), 한 영상 = 한 개념                    |
| **구조**   | Hook → Core Idea → Mechanism → Example → Recap (4비트 학습 구조)    |
| **타겟**   | 하루 한 개념씩 마이크로러닝하고 싶은 학습자 ("아이디어용 듀오링고") |
| **차별점** | 출처 자동 인용, 핵심 용어 하이라이트, 다이어그램 중심 비주얼        |

---

## 파이프라인

```
지식 소스 (URL / PDF / MD / 자막)
  └─> Ingestor          fetch + clean + chunk
        └─> Conceptizer LLM이 한 개념 + 4비트 학습 구조 추출
              └─> Scene planner (scene_splitter, 교육 톤)
                    └─> Image gen (`gemini-3.1-flash-image-preview` — 다이어그램/일러스트 프리셋)
                          └─> I2V (`veo-3.1-generate-preview` — 모션 최소화, 호흡 느리게)
                                └─> Narration (`gemini-3.1-flash-tts-preview` — 설명형 보이스)
                                      └─> `gemini-3.1-flash-preview` 정렬 + 리듬 컷
                                            └─> Compose v3 + 키워드 팝, 용어 강조, 출처 인용 오버레이
                                                  └─> final.mp4
```

---

## Shortify 브랜드 프로필 (`brands/shortify/`)

```
brands/shortify/
├── brand.yaml          # 교육형 스타일 프리셋
├── references/         # 다이어그램·화이트보드 스타일 앵커 이미지
├── bgm/                # 저자극 앰비언트
└── templates/          # 4비트 학습 구조 템플릿
```

**`brand.yaml` 핵심 값**:

| 필드                       | shortify                         |
| -------------------------- | -------------------------------- |
| `tts.speed`                | 1.0~1.1x (학습용은 천천히)       |
| `image.style_preset`       | Diagram / 교육 일러스트          |
| `effects.subtitle_palette` | 뉴트럴 + 핵심 용어 강조 컬러     |
| `effects.footer_slot`      | 출처 인용 footer                 |
| `bgm.volume`               | 0.10 (집중 방해 최소)            |

---

## 신규 모듈

| 위치                          | 역할                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `shortify/ingest/url.py`      | readability로 URL → 정제 본문                                                                 |
| `shortify/ingest/pdf.py`      | pypdf · pdfplumber로 PDF → 텍스트 + 메타데이터                                                |
| `shortify/ingest/youtube.py`  | yt-dlp + 자동 자막으로 유튜브 → 텍스트                                                        |
| `shortify/ingest/markdown.py` | 마크다운 frontmatter 파싱 + 본문                                                              |
| `shortify/conceptizer.py`     | `gemini-3.1-flash-lite-preview` 호출 → `{concept, hook, beats[4], keywords[], citation}` JSON |
| `shortify/overlays.py`        | `term_highlight()` + `citation_footer()`                                                      |

---

## 단계별 로드맵

### Phase 0 — 스캐폴드 (1일)
- `brands/shortify/brand.yaml`, references, BGM 플레이스홀더
- 손으로 작성한 스크립트 한 편을 기존 파이프라인에 흘려서 브랜드 프로필이 정상 동작하는지 스모크 테스트

### Phase 1 — Conceptizer (2~3일)
- LLM 추출기 + 프롬프트 작성
- 입력: 정제 텍스트 / 출력: scene_splitter가 소비할 JSON
- 다양한 소스 5개로 테스트 (위키 아티클, arXiv 초록, 블로그, 교과서 챕터, 팟캐스트 자막)

### Phase 2 — 인제스터 (2일)
- URL fetch (readability)
- PDF (pypdf 또는 pdfplumber)
- 유튜브 자막 (yt-dlp + auto-captions)
- 각 인제스터의 단일 책임: **정제 텍스트 + 메타데이터** 반환

### Phase 3 — 교육형 비주얼 (3~5일)
- `gemini-3.1-flash-image-preview` 프롬프트를 다이어그램/일러스트 톤으로 튜닝
- 용어 하이라이트, 인용 footer 오버레이 신규
- "정의" 비트에 split-screen (텍스트 + 이미지) 실험

### Phase 4 — End-to-end CLI (1일)
```bash
shortify generate --source <url|pdf|md> --out <dir>
```
한 명령으로 전체 파이프라인 실행.

### Phase 5 — 품질 게이트 (이후)
- 캡션 커버리지, 인용 정확도 자동 체크
- "이 영상이 실제로 개념을 가르쳤는가" LLM-graded 평가

---

## 결정 필요 사항 (5가지)

빌드 시작 전에 답이 필요한 질문들:

1. **소스 우선순위**: v0에서 가장 중요한 입력 포맷은? (URL 아티클 / PDF / 유튜브 자막 → Phase 2 순서 결정)
   1. 답변: PDF
2. **언어**: 한국어 우선? 영어 우선? 이중 언어?
   1. 답변: 모든 UI 노출 언어는 영어
3. **개념 단위**: 한 영상 = 한 개념 (60초, 집중형) vs. 한 소스 → 다중 영상 시리즈?
   1. 답변: 한 영상 = 한 개념
4. **비주얼 스타일**: 다이어그램 중심 (화이트보드, 화살표, 스키마) vs. 정적 일러스트 + 키워드 팝?
5. **배포 타겟**: Reels / Shorts / TikTok 셋 다 vs. v0에서 하나만?

---

## 파이프라인 모듈 구성

| 모듈                                                | 비고                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `image_gen.py`                                      | 브랜드 프로필로 톤 변경                        |
| `video_gen.py` (`veo-3.1-generate-preview`)         | I2V 클립 생성                                  |
| `narration_gen.py` (`gemini-3.1-flash-tts-preview`) | voice·speed는 brand.yaml로 오버라이드          |
| `alignment.py` (`gemini-3.1-flash-preview`)         | 단어 단위 타임스탬프                           |
| `rhythm_cut.py`                                     | 박자 기반 컷 계획                              |
| `compose_v3.py`                                     | overlay slot 확장                              |
| `overlays.py`                                       | term_highlight + citation_footer               |
| `scene_splitter.py`                                 | 교육 톤 system prompt를 brand가 주입           |

**비용 추정**: 영상 미디어 ~$2.70/영상 + LLM 호출 비용 $0.05~$0.20/영상.
