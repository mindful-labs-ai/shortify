# 03. Python Sidecar

## 역할

- 영상 생성 파이프라인 실행 (video-cli 포팅 코어)
- localhost FastAPI로 React 프론트와 통신
- SQLite로 영속화 + asyncio 워커로 백그라운드 작업 처리

## 디렉토리

```
sidecar/
├── pyproject.toml
├── PyInstaller.spec
└── shortify_sidecar/
    ├── __init__.py
    ├── main.py                    # FastAPI 부트, uvicorn 임베드
    ├── config.py                  # 포트/토큰/경로 주입
    ├── api/
    │   ├── upload.py
    │   ├── toc.py
    │   ├── jobs.py
    │   ├── concepts.py
    │   ├── health.py
    │   └── deps.py                # Bearer 토큰 검증, DB 세션
    ├── services/
    │   ├── upload_service.py
    │   ├── toc_service.py
    │   ├── job_service.py
    │   ├── concept_service.py
    │   └── notify_service.py      # SSE 이벤트 푸시
    ├── db/
    │   ├── schema.sql
    │   ├── migrations/
    │   ├── repo.py                # CRUD
    │   └── models.py              # sqlmodel
    ├── queue/
    │   ├── persistent.py          # SQLite-backed asyncio queue
    │   └── workers.py             # extract_toc, conceptize, generate_video
    ├── pipeline/                  # video-cli 포팅
    │   ├── ingest_pdf.py
    │   ├── conceptizer.py
    │   ├── scene_splitter.py
    │   ├── image_gen.py
    │   ├── video_gen.py
    │   ├── narration_gen.py
    │   ├── alignment.py
    │   ├── rhythm_cut.py
    │   ├── compose.py
    │   ├── overlays.py
    │   ├── effects.py
    │   └── make_mask.py
    ├── storage/
    │   └── paths.py               # ~/Library/Application Support/Shortify
    └── ext/
        ├── gemini_text.py     # gemini-3.1-flash-lite-preview
        ├── gemini_image.py    # gemini-3.1-flash-image-preview
        ├── veo_video.py       # veo-3.1-generate-preview
        ├── gemini_tts.py      # gemini-3.1-flash-tts-preview
        └── gemini_audio.py    # gemini-3.1-flash-preview (alignment)
```

## 부팅 시퀀스 (사이드카)

```
1. Tauri Shell이 사이드카 spawn
   환경변수:  SHORTIFY_PORT (e.g. 51234)
              SHORTIFY_TOKEN (랜덤 32바이트 base64)
              SHORTIFY_APP_SUPPORT (~/Library/.../Shortify)
              SHORTIFY_FFMPEG (앱 번들 내 정적 ffmpeg 경로)

2. config.py가 환경변수 로드, 미설정시 즉시 종료

3. db/repo.py가 SQLite 파일 열기 (없으면 schema.sql 적용 + concept seed)

4. queue/persistent.py가 미완료 task 복구 (앱 강제종료 후 재시작 시나리오)

5. asyncio Workers (n=N_CONCURRENCY) 시작

6. uvicorn이 127.0.0.1:SHORTIFY_PORT 바인딩

7. /health 응답 시작 → Tauri Shell이 health 확인 후 React 앱 마운트
```

## API 라우터

```python
# api/jobs.py
@router.post("/jobs")
async def create_jobs(
    body: CreateJobsBody,
    user: TokenUser = Depends(verify_token),
    job_svc: JobService = Depends(),
):
    return await job_svc.create_for_sections(body.pdf_id, body.sections)

@router.get("/jobs/{job_id}/stream")
async def stream(job_id: str, user: TokenUser = Depends(verify_token)):
    return EventSourceResponse(notify_service.subscribe(job_id))
```

## 작업 큐 (SQLite-backed)

```python
# queue/persistent.py
class PersistentQueue:
    """앱 종료/크래시 후에도 미완료 task 복구 가능한 큐."""

    async def push(self, task_type: str, payload: dict) -> int: ...
    async def pop(self) -> Task | None:        # status=pending → running
        ...
    async def ack(self, task_id: int) -> None: # status=running → done
        ...
    async def nack(self, task_id: int, error: str) -> None:
        # attempts++; if attempts < max: status=pending else failed
        ...
```

워커는 N=4 정도로 시작. CPU-bound (ffmpeg)와 IO-bound (외부 API 대기) 혼재라 적당.

## 워커 구현 패턴

```python
# queue/workers.py
async def worker_loop(queue: PersistentQueue):
    while True:
        task = await queue.pop()
        if task is None:
            await asyncio.sleep(0.5)
            continue
        try:
            await dispatch(task)
            await queue.ack(task.id)
        except Exception as e:
            await queue.nack(task.id, str(e))

async def dispatch(task: Task):
    if task.type == "extract_toc":
        await extract_toc_handler(task.payload)
    elif task.type == "conceptize":
        await conceptize_handler(task.payload)
    elif task.type == "generate_video":
        await generate_video_handler(task.payload)
```

`generate_video_handler`는 stage 4~8을 순차 실행하며 매 단계마다 `notify_service.publish(job_id, stage, message)` 호출 → SSE로 흘려보냄.

## 외부 API 어댑터

```python
# ext/gemini_text.py — gemini-3.1-flash-lite-preview
class GeminiTextClient:
    MODEL = "gemini-3.1-flash-lite-preview"
    def __init__(self, api_key: str): ...
    async def conceptize(self, text: str) -> ConceptizedJSON: ...
    async def extract_toc(self, raw_text: str) -> list[TocItem]: ...

# ext/gemini_image.py — gemini-3.1-flash-image-preview
class GeminiImageClient:
    MODEL = "gemini-3.1-flash-image-preview"
    async def generate_image(self, prompt: str, refs: list[Path]) -> Path: ...

# ext/veo_video.py — veo-3.1-generate-preview (I2V)
class VeoVideoClient:
    MODEL = "veo-3.1-generate-preview"
    async def i2v(self, image: Path, motion_preset: str) -> Path: ...

# ext/gemini_tts.py — gemini-3.1-flash-tts-preview
class GeminiTtsClient:
    MODEL = "gemini-3.1-flash-tts-preview"
    async def tts(self, text: str, voice: str, speed: float) -> Path: ...

# ext/gemini_audio.py — gemini-3.1-flash-preview (audio understanding)
class GeminiAudioClient:
    MODEL = "gemini-3.1-flash-preview"
    async def align(self, audio: Path, text: str) -> list[WordTiming]: ...
```

API 키는 단일 `GEMINI_API_KEY` 하나로 통합. Tauri Shell이 Keychain에서 읽어 환경변수로 사이드카에 주입 (사이드카는 Keychain 직접 접근 안 함 — 권한 분리).

## 에러 처리

- 외부 API 실패 → 지수 백오프 재시도 (최대 3회)
- 3회 실패 → job stage = -1 (failed), error 메시지 저장, SSE에 push
- 사이드카 크래시 → Tauri Shell이 health 폴링 실패 감지 → 사용자에게 재시작 다이얼로그

## 다음 문서

- DB 스키마 → [04-data-model](./04-data-model.md)
- API 스펙 → [05-api-spec](./05-api-spec.md)
- 파이프라인 상세 → [06-pipeline](./06-pipeline.md)
