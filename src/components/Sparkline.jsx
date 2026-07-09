import { scoreTone } from '../lib/analysis';

const TONE_COLOR = {
  good: '#8fa682',
  ok: '#8fa682',
  watch: '#d3a556',
  warn: '#cd8071'
};

// 홈 대시보드용 미니 추세선. 점수 2개 이상일 때만 그립니다.
// 세로 스케일에 최소 폭(6점)을 둬서, 1~2점짜리 노이즈가 극적인 등락처럼 보이지 않게 합니다.
export function Sparkline({ points, width = 76, height = 20 }) {
  if (!points || points.length < 2) return null;
  const scores = points.map((point) => point.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const rawSpan = max - min;
  const span = Math.max(rawSpan, 6);
  const lo = min - (span - rawSpan) / 2;
  const stepX = (width - 4) / (scores.length - 1);
  const coords = scores
    .map((score, i) => `${(2 + i * stepX).toFixed(1)},${(height - 3 - ((score - lo) / span) * (height - 6)).toFixed(1)}`)
    .join(' ');
  const color = TONE_COLOR[scoreTone(scores[scores.length - 1])];
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
