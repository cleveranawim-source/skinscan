// 기록은 브라우저 localStorage에만 남습니다. 사진이 아니라 점수·리포트 내용(숫자와 문구)만
// 저장하며, 브라우저 데이터를 지우거나 "기록 삭제"를 누르면 바로 사라집니다.
import { buildRecommendations } from './recommendations';

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

// 리포트 화면과 똑같은 내용(항목별 점수·근거·추천 화장품)을 그대로 남깁니다.
// 사진(imageUrl)과 얼굴 좌표(rois)는 저장하지 않습니다 — 애초에 사진 자체를 저장하지 않는다는
// 원칙과, 기록을 나중에 다시 볼 때 사진 없이도 리포트 내용 자체는 온전히 보이게 하기 위해서입니다.
export function saveScan(analysis) {
  if (!analysis?.faceDetected) return getHistory();
  const entry = {
    id: `${Date.now()}`,
    date: new Date().toISOString(),
    overall: analysis.overall,
    confidence: analysis.confidence,
    qualityScore: analysis.qualityScore,
    quality: analysis.quality,
    raw: analysis.raw,
    metrics: analysis.metrics,
    recommendations: buildRecommendations(analysis)
  };
  const next = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 사파리 프라이빗 모드 등 localStorage를 못 쓰는 환경에서는 조용히 건너뜁니다.
  }
  return next;
}

// 이전 버전(요약만 저장)에서 만들어진 기록은 리포트 상세를 다시 볼 수 없습니다.
// 클릭 가능 여부를 판단할 때 씁니다.
export function hasFullReport(entry) {
  return Boolean(entry?.quality && entry?.raw && entry?.recommendations && entry?.metrics?.[0]?.raw !== undefined);
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

// 재촬영 간 점수 노이즈(조명·각도 미세 차이)가 있어서, 이 폭 안의 변화는
// "변화"가 아니라 "비슷함"으로 표시합니다. 실측 편차가 쌓이면 값을 갱신하세요.
export const DELTA_NOISE_FLOOR = 5;

export function deltaDisplay(delta) {
  if (delta === null || delta === undefined) return null;
  if (Math.abs(delta) < DELTA_NOISE_FLOOR) return { text: '비슷해요', cls: 'delta-flat' };
  return delta > 0 ? { text: `+${delta}`, cls: 'delta-up' } : { text: `${delta}`, cls: 'delta-down' };
}

// 두 스캔의 촬영 조건(조명)이 비교 가능한 수준인지 평가합니다.
// 점수 공식은 사진 한 장 안에서는 일관되지만, 조명이 크게 다른 두 사진의 점수 차이는
// 피부 변화가 아니라 촬영 조건 차이일 수 있어서 그 사실을 사용자에게 알려야 합니다.
export function lightingComparability(rawA, rawB) {
  if (!rawA || !rawB) return null;
  const issues = [];
  if (Math.abs(rawA.avgLum - rawB.avgLum) > 35) issues.push('밝기');
  if (Math.abs(rawA.glareRatio - rawB.glareRatio) > 6) issues.push('반사광');
  if (Math.abs(rawA.contrast - rawB.contrast) > 18) issues.push('대비');
  return { comparable: issues.length === 0, issues };
}

export function formatHistoryDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 로컬 타임존 기준 YYYY-MM-DD. 'sv-SE' 로케일이 이 형식을 그대로 씁니다.
function localDayKey(dateLike) {
  return new Date(dateLike).toLocaleDateString('sv-SE');
}

// 스캔한 날의 수(같은 날 여러 번 찍어도 1일). 홈의 "기록 N일째" 표기에 씁니다.
export function scanDayCount(history) {
  return new Set(history.map((entry) => localDayKey(entry.date))).size;
}

// 이번 주(월요일 시작) 7일에 대해, 스캔 여부/오늘/미래 상태를 돌려줍니다. 홈 주간 스트립용.
export function currentWeekStrip(history) {
  const scannedDays = new Set(history.map((entry) => localDayKey(entry.date)));
  const today = new Date();
  const todayKey = localDayKey(today);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const labels = ['월', '화', '수', '목', '금', '토', '일'];
  return labels.map((label, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const key = localDayKey(day);
    return {
      label,
      scanned: scannedDays.has(key),
      isToday: key === todayKey,
      isFuture: key > todayKey
    };
  });
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
