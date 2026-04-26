# 02. Frontend (React + Tauri Shell)

## 스택

| 영역 | 선택 |
|------|------|
| 셸 | Tauri 2 (Rust) |
| UI 프레임워크 | React 19 |
| 빌드 | Vite |
| 스타일 | Tailwind + shadcn/ui |
| 상태 | Zustand |
| 폼 | react-hook-form + zod |
| 라우팅 | React Router (HashRouter — file:// 환경 안전) |
| 실시간 | EventSource (SSE) |

## 디렉토리

```
src/
├── main.tsx                # Vite 진입점
├── App.tsx                 # 라우터 + 글로벌 프로바이더
├── pages/
│   ├── DropView.tsx        # 랜딩 (PDF 드롭)
│   ├── TocCheckList.tsx    # 목차 체크리스트
│   ├── ImageConceptPicker.tsx
│   ├── JobProgressBoard.tsx
│   ├── VideoLibrary.tsx
│   └── Settings.tsx        # API 키 입력
├── components/
│   ├── DropZone.tsx
│   ├── ImageConceptCard.tsx
│   ├── JobProgressCard.tsx
│   ├── VideoPlayer.tsx
│   └── ui/                 # shadcn 생성물
├── lib/
│   ├── api.ts              # localhost API 클라이언트 (Bearer 토큰 자동 첨부)
│   ├── sse.ts              # EventSource 래퍼 + auto-reconnect
│   ├── tauri.ts            # invoke 래퍼 (keychain, file pickers)
│   └── format.ts
├── store/
│   ├── pdfStore.ts
│   ├── jobStore.ts
│   ├── conceptStore.ts
│   └── settingsStore.ts
├── hooks/
│   ├── useJobStream.ts     # SSE 구독 훅
│   └── usePdfUpload.ts
└── styles/
    └── globals.css
```

## 페이지 흐름

```
DropView ──drop PDF──► TocCheckList ──check 5──► ImageConceptPicker
                                                      │ select
                                                      ▼
                                                JobProgressBoard
                                                      │ done
                                                      ▼
                                                VideoLibrary
```

Settings는 메뉴바 또는 톱니 아이콘에서 모달로 진입.

## 상태 관리 (Zustand)

```ts
// store/jobStore.ts
interface JobStore {
  jobs: Record<string, Job>;          // jobId → Job
  activeJobIds: string[];              // 현재 진행 중
  upsertJob: (j: Job) => void;
  applyEvent: (e: JobEvent) => void;   // SSE 이벤트 처리
}
```

SSE에서 받은 이벤트는 `applyEvent`로 부분 업데이트. UI는 selector로 구독해 불필요한 리렌더 방지.

## SSE 구독 패턴

```ts
// hooks/useJobStream.ts
export function useJobStream(jobId: string) {
  const apply = useJobStore(s => s.applyEvent);
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/jobs/${jobId}/stream`, {
      withCredentials: false,
    });
    es.onmessage = (ev) => apply(JSON.parse(ev.data));
    es.onerror = () => { /* exponential backoff reconnect */ };
    return () => es.close();
  }, [jobId]);
}
```

## Tauri ↔ React IPC

| Tauri command | 용도 |
|---------------|------|
| `keychain_set(service, key, value)` | API 키 저장 |
| `keychain_get(service, key)` | API 키 조회 (없으면 null) |
| `sidecar_status()` | 사이드카 health · 포트 · 토큰 |
| `sidecar_restart()` | 사이드카 재시작 |
| `open_in_finder(path)` | 결과 영상 Finder에서 보기 |
| `pick_directory()` | 출력 폴더 선택 |
| `check_for_updates()` | Sparkle 업데이트 확인 |

```ts
import { invoke } from '@tauri-apps/api/core';
const apiKey = await invoke<string>('keychain_get', { service: 'shortify', key: 'anthropic' });
```

## 부팅 시퀀스

```
1. Tauri Shell 부팅
2. Python sidecar spawn (포트 + 토큰 환경변수 주입)
3. /health 폴링 (timeout 10s)
4. Health OK → window.SHORTIFY_API = { baseUrl, token } 주입
5. React 앱 마운트
```

## 디자인 시스템

- **컬러**: Neutral 계열 베이스 + Accent 1색 (학습 톤이라 차분하게)
- **다크모드**: `prefers-color-scheme` 자동 + Settings에서 강제 토글
- **타이포**: Pretendard (한국어), Inter (영문)
- **모션**: framer-motion으로 카드 진입/완료 애니메이션 (subtle)

## 접근성

- 모든 인터랙티브 엘리먼트 키보드 포커스 가능
- aria-label 빠짐없이
- Drop 영역은 클릭으로도 파일 선택 가능 (드래그 못 하는 사용자 대응)

## 다음 문서

- 사이드카 → [03-sidecar](./03-sidecar.md)
- API 스펙 → [05-api-spec](./05-api-spec.md)
