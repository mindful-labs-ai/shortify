# 06. Video Generation Pipeline

## Stage 정의

| stage | 이름 | 입력 | 출력 | 외부 의존 | ETA |
|-------|------|------|------|-----------|-----|
| 0 | `queued` | (job 생성) | — | — | 즉시 |
| 1 | `extracting_section` | pdf_id + section_idx | section_text.txt | pypdf | ~5s |
| 2 | `conceptizing` | section_text | conceptized.json | `gemini-3.1-flash-lite-preview` | ~15s |
| 3 | `awaiting_image_choice` | (사용자 입력 대기) | image_concept_slug | — | (사용자) |
| 4 | `generating_images` | conceptized + image_concept | 14 PNG | `gemini-3.1-flash-image-preview` | ~60s |
| 5 | `generating_clips` | 14 PNG + motion preset | 14 MP4 | `veo-3.1-generate-preview` | ~5~7m |
| 6 | `generating_narration` | conceptized.text | narration.mp3 | `gemini-3.1-flash-tts-preview` | ~30s |
| 7 | `aligning` | narration.mp3 + text | aligned_words.json | `gemini-3.1-flash-preview` | ~30s |
| 8 | `composing` | clips + narration + words + concept | final.mp4 | ffmpeg | ~2m |
| 9 | `done` | — | output_video_path | — | — |
| -1 | `failed` | error | — | — | — |

**총 ETA**: ~10~12분 (이미지 선택 대기 시간 제외).

## 파이프라인 흐름도

```
                  ┌──────────────────┐
PDF + section ──► │ pipeline/        │ ──► section_text.txt
                  │  ingest_pdf.py   │
                  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐     ┌─────────────────────┐
                  │ pipeline/        │ ◄──► │ ext/gemini_text.py  │
                  │  conceptizer.py  │     │ (flash-lite-preview) │
                  └──────────────────┘     └─────────────────────┘
                          │ conceptized.json
                          ▼
                  ┌──────────────────┐
                  │ pipeline/        │ ──► 14 scene specs
                  │  scene_splitter  │
                  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐     ┌─────────────────────┐
                  │ pipeline/        │ ◄──► │ ext/gemini_image.py │
                  │  image_gen.py    │     │ (flash-image-preview)│
                  └──────────────────┘     └─────────────────────┘
                          │ 14 PNG
                          ▼
                  ┌──────────────────┐     ┌─────────────────────┐
                  │ pipeline/        │ ◄──► │ ext/veo_video.py    │
                  │  video_gen.py    │     │ (veo-3.1-generate)  │
                  └──────────────────┘     └─────────────────────┘
                          │ 14 MP4
                          │
   conceptized.text ──┐   │
                      ▼   │
                  ┌──────────────────┐     ┌─────────────────────┐
                  │ pipeline/        │ ◄──► │ ext/gemini_tts.py   │
                  │  narration_gen   │     │ (flash-tts-preview)  │
                  └──────────────────┘     └─────────────────────┘
                          │ narration.mp3
                          ▼
                  ┌──────────────────┐     ┌─────────────────────┐
                  │ pipeline/        │ ◄──► │ ext/gemini_audio.py │
                  │  alignment.py    │     │ (flash-preview)      │
                  └──────────────────┘     └─────────────────────┘
                          │ aligned_words.json
                          ▼
                  ┌──────────────────┐
                  │ pipeline/        │
                  │  rhythm_cut.py   │
                  └──────────────────┘
                          │ rhythm_plan.json
                          ▼
                  ┌──────────────────┐  uses ffmpeg-full bundle
                  │ pipeline/        │  + overlays (subtitle, hook,
                  │  compose.py      │    citation, term_highlight)
                  │  + overlays.py   │  + effects (fuji filter, grain)
                  │  + effects.py    │  + make_mask (vignette)
                  │  + make_mask.py  │
                  └──────────────────┘
                          │
                          ▼
                    final.mp4 (1080×1920, 30fps)
```

## 각 모듈 입출력 명세

### `ingest_pdf.extract_section()`
```python
def extract_section(pdf_path: Path, section_idx: int, toc: list[TocItem]) -> str:
    """Returns plain text of the section (joined paragraphs)."""
```
구현: pypdf로 page_start ~ page_end 추출 → 노이즈 제거 (페이지 번호, 헤더/푸터).

### `conceptizer.conceptize()`
```python
async def conceptize(text: str, lang: str = "ko") -> ConceptizedJSON:
    """`gemini-3.1-flash-lite-preview`로 4비트 학습 구조 추출."""
```
프롬프트는 `prompts/conceptizer.md` (별도 파일). 출력 스키마는 [04-data-model.md](./04-data-model.md) 참고.

### `scene_splitter.split()`
```python
def split(conceptized: ConceptizedJSON, n_scenes: int = 14) -> list[SceneSpec]:
    """4비트를 14씬으로 분할 + 비주얼 디렉션 부여."""
```

### `image_gen.generate()`
```python
async def generate(scene: SceneSpec, concept: ImageConcept, refs: list[Path]) -> Path:
    """`gemini-3.1-flash-image-preview` 호출 → 1024×1024 PNG."""
```
프롬프트는 `concept.image_style_preset` + scene 디렉션 + 부정 프롬프트. 동시 요청 ≤ 4.

### `video_gen.i2v()`
```python
async def i2v(image: Path, motion: str, duration_sec: int = 5) -> Path:
    """`veo-3.1-generate-preview` I2V → 5초 MP4."""
```

### `narration_gen.tts()`
```python
async def tts(text: str, voice: str, speed: float) -> Path:
    """`gemini-3.1-flash-tts-preview` Korean → MP3."""
```
shortify 기본 voice는 학습형 (속도 1.0~1.1x).

### `alignment.align_words()`
```python
async def align_words(audio: Path, text: str) -> list[Word]:
    """`gemini-3.1-flash-preview` 오디오 이해 → word-level timestamps."""
```

### `rhythm_cut.plan()`
```python
def plan(scenes: list[SceneSpec], words: list[Word]) -> RhythmPlan:
    """나레이션 박자에 맞춰 mid/late/front/hold 컷 계획."""
```

### `compose.compose_final()`
```python
def compose_final(
    clips: list[Path],
    narration: Path,
    words: list[Word],
    plan: RhythmPlan,
    concept: ImageConcept,
    conceptized: ConceptizedJSON,
    out: Path,
):
    """ffmpeg로 리듬 컷 + 필터 + 자막 + 훅 + CTA + BGM → final.mp4."""
```

호출하는 ffmpeg 필터 체인 (요약):
- `[clips concat] → fps=30, scale=1080:1920`
- `→ curves` (Fuji 필터) + `eq=saturation=...,contrast=...,gamma=...`
- `→ noise=alls=8` (필름 그레인)
- `→ overlay [mask]` (둥근 모서리)
- `→ subtitles` (libass, ASS 포맷, 강조어 색상 적용)
- `→ overlay [hook_png]`
- `→ overlay [citation_footer_png]`
- `audio: narration + bgm (volume=0.10, fade)`

## 진행 푸시

각 함수는 `notify_service.publish(job_id, stage, message, progress_pct)`를 호출.

예: `image_gen.generate()`는 14장 처리 중 매번 publish.

## 실패 시나리오

| 실패 | 처리 |
|------|------|
| `gemini-3.1-flash-image-preview` 일시 오류 | 지수 백오프 3회 재시도 |
| `gemini-3.1-flash-image-preview` 컨텐츠 정책 거부 | 프롬프트 자동 sanitize 후 1회 재시도, 실패 시 fallback 정적 이미지 |
| `veo-3.1-generate-preview` 5초 클립 깨짐 | 해당 씬만 재생성 |
| `gemini-3.1-flash-tts-preview` 음성 끊김 | 전체 재생성 (TTS는 빠름) |
| `gemini-3.1-flash-preview` 정렬 매칭 실패 | char-ratio 폴백 |
| ffmpeg 죽음 | stderr 로그 캡처, stage = -1, 사용자 재시도 가능 |

## 출력물

```
output/<job_id>/
├── images/scene_001.png ... scene_014.png
├── clips/scene_001.mp4 ...
├── narration.mp3
├── aligned_words.json
├── rhythm_plan.json
├── overlays/                # subtitle ASS, hook PNG, footer PNG
├── final.mp4                ← 사용자 결과물
└── compose.log              # ffmpeg 로그 (디버깅용)
```
