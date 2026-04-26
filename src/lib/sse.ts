// EventSource 래퍼: 사이드카 SSE 스트림 구독.
// 토큰은 쿼리스트링으로 (EventSource는 커스텀 헤더 미지원).

export type JobEvent = {
  job_id: string;
  stage: number;
  message: string | null;
  progress_pct?: number;
};

export function subscribeJob(
  url: string,
  onEvent: (e: JobEvent) => void,
  onError?: (e: Event) => void,
): () => void {
  const es = new EventSource(url);
  es.onmessage = (m) => {
    try {
      onEvent(JSON.parse(m.data));
    } catch (err) {
      console.error("Bad SSE payload", err);
    }
  };
  if (onError) es.onerror = onError;
  return () => es.close();
}
