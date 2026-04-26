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
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at   TEXT                        -- soft delete (NULL=활성, ISO8601=삭제 시각)
);

CREATE INDEX idx_pdfs_created ON pdfs(created_at);
CREATE INDEX idx_pdfs_active  ON pdfs(deleted_at) WHERE deleted_at IS NULL;

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
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at            TEXT                        -- soft delete (NULL=활성)
);

CREATE INDEX idx_jobs_pdf       ON jobs(pdf_id);
CREATE INDEX idx_jobs_stage     ON jobs(stage);
CREATE INDEX idx_jobs_created   ON jobs(created_at DESC);
CREATE INDEX idx_jobs_active    ON jobs(deleted_at) WHERE deleted_at IS NULL;

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

## 삭제 정책 — Soft Delete

모든 사용자 데이터(pdfs, jobs)는 **soft delete**한다. 실제 row/파일 삭제는 사용자가 명시적으로 "휴지통 비우기"를 누를 때만 발생한다.

### Soft delete (사용자 "삭제" 클릭)
- `UPDATE jobs   SET deleted_at = datetime('now') WHERE id = ?`
- `UPDATE pdfs   SET deleted_at = datetime('now') WHERE id = ?` → 연결된 모든 jobs도 같은 트랜잭션에서 soft delete
- **파일은 원본 위치 유지** (이동·삭제 안 함)

### 활성 데이터 조회
- 모든 SELECT는 `WHERE deleted_at IS NULL` 필터 (sqlmodel 글로벌 이벤트로 자동 적용 권장)
- `?include_deleted=true` 쿼리로 휴지통 항목까지 노출

### Restore (복원)
- `UPDATE jobs SET deleted_at = NULL WHERE id = ?`
- PDF 복원 시 연결된 jobs는 자동 복원하지 않음 (개별 결정)

### 휴지통 비우기 (사용자 명시 트리거)
- `DELETE FROM jobs WHERE deleted_at IS NOT NULL` (CASCADE로 job_events 정리)
- `DELETE FROM pdfs WHERE deleted_at IS NOT NULL`
- 파일도 함께 hard delete: `rm pdfs/<id>.pdf`, `rm -rf output/<id>/`
- 자동 정리 정책 없음 (사용자가 누르지 않으면 영구 보관)

### "모든 데이터 삭제" (Settings)
- 활성 pdfs / jobs 전체를 soft delete 처리 (휴지통으로 이동)
- API 키는 **즉시 hard delete** (Keychain 항목 제거 — 시크릿은 soft delete 의미 없음)
- 사용자가 추가로 "휴지통 비우기" 누르면 디스크 회수

### 캐시
- `tmp/` 폴더는 soft delete 무관하게 즉시 삭제 가능 (중간 산출물)

## Future PG Migration (설계 규칙)

v0는 SQLite로 출시하지만, 미래에 Postgres로 이전할 가능성을 대비해 **이전 비용을 최소화하는 설계 규칙**을 1일차부터 따른다.

### 1. SQLAlchemy 2.x + sqlmodel + Alembic 사용
- Raw `schema.sql`을 직접 작성하지 않고 SQLModel 모델만 정의 → `alembic upgrade head`로 스키마 생성
- DB 방언은 SQLAlchemy가 추상화 → SQLite/PG 양쪽에 동일 모델
- Async: `aiosqlite`(SQLite, v0) ↔ `asyncpg`(PG, 미래) 둘 다 SQLAlchemy 2 async 지원

### 2. SQLite-only 기능 금지 리스트
| 금지 | 대안 |
|------|------|
| `WITHOUT ROWID`, `STRICT` 모드 | 표준 SQL 타입만 사용 |
| `INSERT OR IGNORE` / `INSERT OR REPLACE` | `INSERT ... ON CONFLICT (...)` (양쪽 호환) |
| `json_extract()` 등 SQLite JSON1 함수 | SQLAlchemy `JSON` 타입 + Python에서 파싱. PG 이전 시 한 번에 `jsonb`로 마이그레이션 |
| `INTEGER PRIMARY KEY` rowid 트릭 | 명시적 `id INTEGER PRIMARY KEY AUTOINCREMENT` 또는 ULID(TEXT) |
| `datetime('now')` SQL 함수로 default | Python 측 `default=datetime.utcnow` (SQLAlchemy `Column(default=...)`) |
| `PRAGMA foreign_keys = ON` 의존 | 양쪽 항상 FK on으로 가정해 코드 작성 |

### 3. 큐 레이어를 인터페이스로 격리
```python
# sidecar/.../queue/base.py
class TaskQueue(Protocol):
    async def enqueue(self, task_type: str, payload: dict) -> int: ...
    async def dequeue_one(self, worker_id: str) -> Task | None: ...
    async def mark_done(self, task_id: int) -> None: ...
    async def mark_failed(self, task_id: int, error: str) -> None: ...
```
- v0: `SqliteTaskQueue` (`UPDATE queue_tasks SET status='running' WHERE id=(SELECT ... LIMIT 1) RETURNING *`)
- v1+: `PostgresTaskQueue` (`FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`)
- 워커 코드는 인터페이스에만 의존 — 구현 교체 시 워커 무수정

### 4. `DATABASE_URL` 환경변수 주도
```python
DATABASE_URL = os.environ.get(
    "SHORTIFY_DATABASE_URL",
    f"sqlite+aiosqlite:///{app_support_dir() / 'db.sqlite'}",
)
```
- v0: SQLite default (사용자 환경)
- 통합 테스트는 PG, 사용자 빌드는 SQLite — 같은 코드베이스로 양쪽 검증 가능
- `SHORTIFY_DATABASE_URL=postgresql+asyncpg://...`로 즉시 전환

### 5. 파일 경로 컬럼은 URI로 추상화
- `local_path TEXT` → `storage_uri TEXT` (`file:///...`)
- 지금은 모두 `file://`이지만, SaaS 피벗 시 `s3://` 추가 가능
- DB 마이그레이션과 스토리지 마이그레이션 분리

### 6. PG 전환 트리거 명시
다음 중 **하나라도** 발생하면 PG 이전 검토:
- 멀티유저 / 공유 라이브러리 도입
- 동일 DB에 여러 사이드카(분산 워커) 접근
- 외부 SaaS 백엔드로 피벗
- 단일 SQLite 파일 1GB+ 또는 동시 쓰기 충돌 발생

이 트리거가 안 오면 영원히 SQLite로 OK.

### 실제 마이그레이션 작업 (트리거 발생 시)

1. PG 인스턴스 띄움 (Docker / RDS / Cloud SQL)
2. `pip install -e ".[pg]"` (asyncpg 추가) + `pyproject.toml`에 등록
3. `alembic upgrade head` (모델 동일, 새 PG DB에 스키마 생성)
4. 데이터 복제: `pgloader sqlite:///path postgresql://...` 한 줄
5. `SHORTIFY_DATABASE_URL` 교체 + 큐 구현을 `PostgresTaskQueue`로 주입
6. `JSON` 컬럼 → `JSONB`로 alter (선택, 성능 개선)
7. 통합 테스트 → 사용자 머신은 영향 없음 (SaaS 모드면 서버 사이드만)

### v0 코드에 박아둘 것

| 위치 | 역할 |
|------|------|
| `sidecar/shortify_sidecar/db/models.py` | SQLModel 클래스 (raw SQL 금지) |
| `sidecar/shortify_sidecar/db/migrations/` | Alembic 환경 (`alembic init`) |
| `sidecar/shortify_sidecar/queue/{base,sqlite_impl}.py` | TaskQueue 인터페이스 + SQLite 구현 |
| `sidecar/shortify_sidecar/settings.py` | `DATABASE_URL` env 주도 + 기본값 |

---

## 다음 문서

- API 스펙 → [05-api-spec](./05-api-spec.md)
- 파이프라인 → [06-pipeline](./06-pipeline.md)
