// 기록은 브라우저 localStorage에만 남습니다. 사진이 아니라 점수(숫자)만 저장하며,
// 브라우저 데이터를 지우거나 "기록 삭제"를 누르면 바로 사라집니다.
const STORAGE_KEY = 'skincheck-history-v1';
const MAX_ENTRIES = 20;

export function getHistory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScan(analysis) {
  if (!analysis?.faceDetected) return getHistory();
  const entry = {
    id: `${Date.now()}`,
    date: new Date().toISOString(),
    overall: analysis.overall,
    confidence: analysis.confidence,
    metrics: analysis.metrics.map((metric) => ({ id: metric.id, label: metric.label, score: metric.score }))
  };
  const next = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 사파리 프라이빗 모드 등 localStorage를 못 쓰는 환경에서는 조용히 건너뜁니다.
  }
  return next;
}

export function clearHistory() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function trendFor(history, metricId) {
  return [...history]
    .reverse()
    .map((entry) => {
      if (metricId === 'overall') return { date: entry.date, score: entry.overall };
      const metric = entry.metrics.find((item) => item.id === metricId);
      return metric ? { date: entry.date, score: metric.score } : null;
    })
    .filter(Boolean);
}
