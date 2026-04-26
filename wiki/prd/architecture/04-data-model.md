# 04. Data Model

## 저장 위치

```
~/Library/Application Support/Shortify/
├── db.sqlite                       # SQLite 단일 파일
├── pdfs/<pdf_id>.pdf               # 원본 PDF
├── output/<job_id>/                # 영상별 산출물
│   ├── images/scene_001.png ... scene_014.png
│   ├── clips/scene_001.mp4 ...
│   ├── narration.mp3
│   ├── aligned_words.json
│   ├── compose_plan.json
│   └── final.mp4
├── logs/sidecar.log
└── tmp/                             # 중간 파일 (필요 시 정리)
```

## SQLite 스키마

```sql
-- pdfs: 사용자가 업로드한 PDF
CREATE TABLE pdfs (
  id           TEXT PRIMARY KEY,           -- ULID
  filename     TEXT NOT NULL,
  local_path   TEXT NOT NULL,              -- pdfs/<id>.pdf
  page_count   INTEGER,
  toc_json     TEXT,                       -- [{idx, title, page_start, page_end, depth}]
  size_bytes   INTEGER,
  sha256       TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_pdfs_created ON pdfs(created_at);

-- image_concepts: 관리자/번들 큐레이션 비주얼 프리셋
CREATE TABLE image_concepts (
  slug                    TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  description             TEXT,
  preview_path            TEXT NOT NULL,    -- assets/image_concepts/<slug>/preview.png
  image_style_preset      TEXT NOT NULL,    -- gemini-3.1-flash-image-preview 프롬프트 머리말
  reference_image_paths   TEXT,             -- JSON: ["assets/.../ref1.png", ...]
  active                  INTEGER NOT NULL DEFAULT 1,
  sort_order              INTEGER NOT NULL DEFAULT 0
);

-- jobs: 영상 1편 = 1 job
CREATE TABLE jobs (
  id                    TEXT PRIMARY KEY,           -- ULID
  pdf_id                TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  toc_section_index     INTEGER NOT NULL,
  toc_section_title     TEXT NOT NULL,
  image_concept_slug    TEXT REFERENCES image_concepts(slug),  -- nullable until stage 4
  stage                 INTEGER NOT NULL DEFAULT 0, -- 0~9, -1 (failed)
  stage_message         TEXT,
  conceptized_json      TEXT,                       -- {title, topic, beats[4], keywords, citation}
  output_video_path     TEXT,                       -- output/<id>/final.mp4
  duration_ms           INTEGER,
  error                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_jobs_pdf       ON jobs(pdf_id);
CREATE INDEX idx_jobs_stage     ON jobs(stage);
CREATE INDEX idx_jobs_created   ON jobs(created_at DESC);

-- job_events: stage 진행 로그 (디버깅 + UI 노출)
CREATE TABLE job_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage       INTEGER NOT NULL,
  message     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_job_events_job ON job_events(job_id, created_at);

-- queue_tasks: persistent asyncio queue
CREATE TABLE queue_tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_type     TEXT NOT NULL,            -- extract_toc | conceptize | generate_video
  payload_json  TEXT NOT NULL,
  status        TEXT NOT NULL,            -- pending | running | done | failed
  attempts      INTEGER NOT NULL DEFAULT 0,
  max_attempts  INTEGER NOT NULL DEFAULT 3,
  scheduled_at  TEXT NOT NULL DEFAULT (datetime('now')),
  started_at    TEXT,
  finished_at   TEXT,
  error         TEXT
);

CREATE INDEX idx_queue_status_sched ON queue_tasks(status, scheduled_at);

-- app_meta: 단일 행 KV
CREATE TABLE app_meta (
  k TEXT PRIMARY KEY,
  v TEXT
);

-- 예: schema_version, app_version, last_seen_version 등
```

## conceptized_json 형태

```json
{
  "title": "어텐션 메커니즘이란?",
  "topic": "Transformer의 핵심 연산",
  "beats": [
    { "kind": "hook",      "text": "기계는 어떻게 '집중'할까?" },
    { "kind": "core",      "text": "어텐션은 입력의 어느 부분을 더 볼지 결정하는 가중치다." },
    { "kind": "mechanism", "text": "Q·K 내적으로 점수, softmax로 분포, V에 가중합." },
    { "kind": "recap",     "text": "결국 어텐션은 '맥락 가중 평균'이다." }
  ],
  "keywords": ["Q", "K", "V", "softmax", "weighted sum"],
  "citation": {
    "source_title": "Attention Is All You Need",
    "page": 3,
    "url": null
  }
}
```

## ImageConcept 시드 데이터 (5종 가정)

| slug | name | 톤 |
|------|------|------|
| `diagram_whiteboard` | 화이트보드 다이어그램 | 화살표·박스·필기체 |
| `illustrated_textbook` | 교과서 일러스트 | 색연필·정갈한 도식 |
| `minimalist_3d` | 미니멀 3D | 은은한 그림자, 단색 |
| `photorealistic` | 사진 합성 | 실사 + 라벨 오버레이 |
| `retro_paper` | 레트로 종이 | 종이 질감, 빈티지 색감 |

각 컨셉의 `image_style_preset`는 `gemini-3.1-flash-image-preview` 프롬프트 머리말로 직접 사용. 첫 실행 시 앱 번들의 `assets/image_concepts/<slug>/concept.json`에서 시드.

## Keychain 키 (별도 저장소)

| service | key | value |
|---------|-----|-------|
| `shortify` | `gemini` | `GEMINI_API_KEY` — 모든 Google Gemini/Veo 호출 (텍스트·이미지·영상·TTS·오디오 정렬) 단일 키 |

설정 화면에서 사용자가 입력 → Tauri의 `security-framework` 래퍼로 저장.

## 마이그레이션 정책

- `app_meta`에 `schema_version` 저장
- 사이드카 부팅 시 schema_version 확인 → 부족하면 `migrations/000X_*.sql` 적용
- 다운그레이드 비지원 (앱 자동 업데이트 전제)

## 정리 작업 (사용자 트리거)

- "영상 삭제" → `DELETE FROM jobs WHERE id = ?` (CASCADE로 events 자동 삭제) + `output/<id>/` 폴더 제거
- "PDF 삭제" → 연결된 모든 jobs도 함께 삭제 + `pdfs/<id>.pdf` 제거
- "전체 캐시 비우기" → `tmp/` 정리

## 다음 문서

- API 스펙 → [05-api-spec](./05-api-spec.md)
- 파이프라인 → [06-pipeline](./06-pipeline.md)
