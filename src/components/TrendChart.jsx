export function TrendChart({ points }) {
  if (points.length < 2) {
    return <p className="trend-empty">추이를 보려면 2회 이상 분석이 필요합니다.</p>;
  }
  const width = 320;
  const height = 120;
  const pad = 14;
  const scores = points.map((point) => point.score);
  const min = Math.min(...scores, 40);
  const max = Math.max(...scores, 90);
  const range = Math.max(1, max - min);
  const stepX = (width - pad * 2) / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = pad + index * stepX;
    const y = height - pad - ((point.score - min) / range) * (height - pad * 2);
    return { x, y };
  });
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" role="img" aria-label="점수 추이 그래프">
      <polyline points={polyline} fill="none" stroke="var(--accent-strong)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, index) => (
        <circle key={index} cx={c.x} cy={c.y} r="3.5" fill="var(--accent-strong)" />
      ))}
    </svg>
  );
}
