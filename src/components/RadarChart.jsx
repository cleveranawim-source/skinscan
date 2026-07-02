// 7축 레이더 차트. 막대 7개는 순서대로 읽어야 하지만, 레이더는 피부 상태의 "모양"이
// 한눈에 들어오고 지난 스캔을 겹쳐 그리면 변화 방향까지 한 그림에 담깁니다.
const SHORT_LABELS = {
  redness: '홍조',
  tone: '피부톤',
  spots: '잡티',
  texture: '피부결',
  shine: '번들거림',
  wrinkle: '잔주름',
  blemish: '트러블'
};

const CX = 170;
const CY = 148;
const R = 96;
const LABEL_R = R + 22;

function pointAt(index, total, score) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const radius = (score / 100) * R;
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
    cos: Math.cos(angle),
    sin: Math.sin(angle)
  };
}

function polygonPoints(scores, total) {
  return scores.map((score, i) => {
    const p = pointAt(i, total, score);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
}

export function RadarChart({ metrics, previousMetrics }) {
  const total = metrics.length;
  if (total < 3) return null;

  // 이전 스캔은 지표 구성이 완전히 일치할 때만 겹칩니다(구버전 6지표 기록 등은 제외).
  const prevById = previousMetrics
    ? Object.fromEntries(previousMetrics.map((m) => [m.id, m.score]))
    : null;
  const overlayScores = prevById && metrics.every((m) => prevById[m.id] !== undefined)
    ? metrics.map((m) => prevById[m.id])
    : null;

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 340 300" className="radar-svg" role="img" aria-label="항목별 점수 레이더 차트">
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(metrics.map(() => level), total)}
            className="radar-grid"
          />
        ))}
        {metrics.map((metric, i) => {
          const outer = pointAt(i, total, 100);
          return <line key={metric.id} x1={CX} y1={CY} x2={outer.x} y2={outer.y} className="radar-axis" />;
        })}
        {overlayScores && (
          <polygon points={polygonPoints(overlayScores, total)} className="radar-prev" />
        )}
        <polygon points={polygonPoints(metrics.map((m) => m.score), total)} className="radar-now" />
        {metrics.map((metric, i) => {
          const p = pointAt(i, total, metric.score);
          return <circle key={metric.id} cx={p.x} cy={p.y} r="3.2" className="radar-dot" />;
        })}
        {metrics.map((metric, i) => {
          const p = pointAt(i, total, 100);
          const lx = CX + p.cos * LABEL_R;
          const ly = CY + p.sin * LABEL_R;
          const anchor = Math.abs(p.cos) < 0.35 ? 'middle' : p.cos > 0 ? 'start' : 'end';
          return (
            <text key={metric.id} x={lx} y={ly + 4} textAnchor={anchor} className="radar-label">
              {SHORT_LABELS[metric.id] || metric.label}
            </text>
          );
        })}
      </svg>
      {overlayScores && (
        <div className="radar-legend">
          <span className="legend-now">이번</span>
          <span className="legend-prev">지난번</span>
        </div>
      )}
    </div>
  );
}
