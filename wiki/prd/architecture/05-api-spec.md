# 05. API Specification

## Base

- **URL**: `http://127.0.0.1:<random_port>` (앱 부팅 시 OS 할당)
- **인증**: `Authorization: Bearer <token>` (앱 부팅 시 32바이트 base64 랜덤 발급)
- **CORS**: 비활성 (외부 호출 차단). React UI도 같은 origin에서 호출.
- **Content-Type**: `application/json` (멀티파트 업로드 제외)

## 인증 / 검증

```python
# api/deps.py
async def verify_token(authorization: str = Header(...)) -> TokenUser:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401)
    token = authorization[7:]
    if token != os.environ["SHORTIFY_TOKEN"]:
        raise HTTPException(403)
    return TokenUser(role="local")
```

다른 로컬 프로세스가 포트를 알아도 토큰이 없으면 호출 실패.

## 엔드포인트

### Health

```
GET /health
→ 200 { "ok": true, "version": "1.0.0", "uptime_sec": 3210 }
```

### PDF 업로드

```
POST /upload
Content-Type: multipart/form-data
fields:
  file: <PDF binary>

→ 201 {
  "pdf_id": "01HXY...",
  "filename": "transformer.pdf",
  "page_count": 142
}
```

업로드 직후 `extract_toc` task를 큐에 자동 enqueue.

### 목차 조회

```
GET /pdfs/{pdf_id}/toc
→ 200 {
  "pdf_id": "01HXY...",
  "ready": true,
  "toc": [
    { "idx": 0, "title": "1. Introduction",        "page_start": 1,  "page_end": 12, "depth": 1 },
    { "idx": 1, "title": "1.1 Background",          "page_start": 2,  "page_end": 5,  "depth": 2 },
    ...
  ]
}
```

`ready=false`면 아직 추출 중 → 클라이언트는 SSE 또는 폴링.

### Job 생성 (1~5개 동시)

```
POST /jobs
{ "pdf_id": "01HXY...", "sections": [3, 7, 12] }

→ 201 {
  "jobs": [
    { "id": "01J...", "stage": 0, "toc_section_index": 3, "toc_section_title": "..." },
    ...
  ]
}
```

각 job은 stage=0 (queued) 상태로 생성, 즉시 conceptize task가 큐에 enqueue.

### Job 단건 조회

```
GET /jobs/{job_id}
→ 200 {
  "id": "01J...",
  "pdf_id": "01HXY...",
  "stage": 4,
  "stage_message": "Generating image 7/14",
  "image_concept_slug": "diagram_whiteboard",
  "conceptized_json": { ... },
  "output_video_path": null,
  "error": null,
  "created_at": "...",
  "updated_at": "..."
}
```

### Job 목록 (라이브러리)

```
GET /jobs?limit=50&offset=0
→ 200 { "jobs": [...], "total": 123 }
```

### Job 진행 SSE

```
GET /jobs/{job_id}/stream
Accept: text/event-stream

서버 → 이벤트 (한 줄 = 1 event):
data: {"job_id":"01J...","stage":1,"message":"Extracting section text"}

data: {"job_id":"01J...","stage":2,"message":"Conceptizing with gemini-3.1-flash-lite-preview"}

data: {"job_id":"01J...","stage":3,"message":"Awaiting image concept selection"}

(사용자가 이미지 선택 후)
data: {"job_id":"01J...","stage":4,"message":"Generating image 1/14"}
data: {"job_id":"01J...","stage":4,"message":"Generating image 2/14"}
...
data: {"job_id":"01J...","stage":9,"message":"Done","output_video_path":"/Users/.../final.mp4"}
```

연결 종료 조건:
- stage = 9 (done) 이벤트 1개 더 emit 후 close
- stage = -1 (failed) 이벤트 emit 후 close
- 클라이언트가 abort

### 이미지 컨셉 선택

```
POST /jobs/{job_id}/select-image
{ "image_concept_slug": "diagram_whiteboard" }

→ 200 { "id": "01J...", "stage": 4 }
```

stage 3 → 4 트리거. `generate_video` task가 큐에 enqueue.

### 재시도

```
POST /jobs/{job_id}/retry
→ 200 { "id": "01J...", "stage": 0 }
```

`failed` 상태에서만 허용. 실패한 stage 이전부터 다시 시작 (자동 판단).

### 삭제

```
DELETE /jobs/{job_id}
→ 204
```

연결된 `output/<job_id>/` 폴더와 DB 행 모두 삭제.

### 이미지 컨셉

```
GET /image-concepts
→ 200 {
  "concepts": [
    {
      "slug": "diagram_whiteboard",
      "name": "화이트보드 다이어그램",
      "description": "...",
      "preview_url": "asset:///image_concepts/diagram_whiteboard/preview.png"
    },
    ...
  ]
}
```

`preview_url`은 Tauri의 `asset://` 프로토콜로 프론트가 직접 표시 (사이드카가 파일 서빙 안 함).

## 에러 응답 포맷

```json
{
  "error": {
    "code": "PDF_NOT_FOUND",
    "message": "PDF 01HXY... not found",
    "detail": null
  }
}
```

| HTTP | code | 의미 |
|------|------|------|
| 400 | `INVALID_INPUT` | 입력값 오류 |
| 401 | `UNAUTHORIZED` | 토큰 없음 |
| 403 | `FORBIDDEN` | 토큰 불일치 |
| 404 | `PDF_NOT_FOUND` / `JOB_NOT_FOUND` | 리소스 없음 |
| 409 | `INVALID_STAGE_TRANSITION` | 예: stage=4인데 select-image 호출 |
| 422 | `MAX_SECTIONS_EXCEEDED` | sections 길이 > 5 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |
| 502 | `EXTERNAL_API_FAILED` | Google Gemini / Veo 호출 실패 (재시도 후 최종 실패) |

## SSE 재연결

클라이언트는 `Last-Event-ID` 헤더로 이어받기 가능. 서버는 `id:` 필드를 emit.

```
id: 42
data: {...}

id: 43
data: {...}
```

재연결 시 클라이언트가 `Last-Event-ID: 42` 보내면 43부터 재전송.

## Rate Limit

- 로컬 단일 사용자라 글로벌 rate limit 없음
- 단, 외부 API (Google Gemini / Veo) 호출은 사이드카가 자체 토큰 버킷으로 제어
  - `gemini-3.1-flash-image-preview`: 동시 요청 ≤ 4
  - `veo-3.1-generate-preview`: 동시 요청 ≤ 2 (비싸고 느림)
  - `gemini-3.1-flash-lite-preview`: 동시 요청 ≤ 3
  - `gemini-3.1-flash-tts-preview` / `gemini-3.1-flash-preview` (정렬): 동시 요청 ≤ 2
