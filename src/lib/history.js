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

export function serializeHistory(history) {
  return JSON.stringify(
    { app: 'skinscan', version: 1, exportedAt: new Date().toISOString(), entries: history },
    null,
    2
  );
}

function isValidEntry(entry) {
  return Boolean(
    entry &&
      typeof entry.id === 'string' &&
      typeof entry.date === 'string' &&
      typeof entry.overall === 'number' &&
      typeof entry.confidence === 'number' &&
      Array.isArray(entry.metrics) &&
      entry.metrics.every(
        (metric) => metric && typeof metric.id === 'string' && typeof metric.label === 'string' && typeof metric.score === 'number'
      )
  );
}

// 가져오기 파일은 사용자가 임의로 편집했을 수 있으니, 모양이 맞는 항목만 걸러 씁니다.
function parseHistoryImport(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.entries) ? parsed.entries : null;
  if (!entries) return null;
  const valid = entries.filter(isValidEntry);
  return valid.length > 0 ? valid : null;
}

// 기존 기록과 합쳐서(같은 id는 건너뛰고) 최신순으로 다시 자릅니다.
export function importHistory(jsonText) {
  const incoming = parseHistoryImport(jsonText);
  const existing = getHistory();
  if (!incoming) return { history: existing, imported: 0, failed: true };

  const existingIds = new Set(existing.map((entry) => entry.id));
  let imported = 0;
  const merged = [...existing];
  incoming.forEach((entry) => {
    if (!existingIds.has(entry.id)) {
      merged.push(entry);
      existingIds.add(entry.id);
      imported += 1;
    }
  });
  merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  const capped = merged.slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // ignore
  }
  return { history: capped, imported, failed: false };
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
