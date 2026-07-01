import { ChevronRight } from 'lucide-react';
import { confidenceLabel, scoreTone } from '../lib/analysis';

export function MetricBar({ metric, onSelect }) {
  const tone = scoreTone(metric.score);
  return (
    <button className="metric-card" onClick={() => onSelect(metric)}>
      <div className="metric-head">
        <span>{metric.label}</span>
        <strong className={`tone-${tone}`}>{metric.score}</strong>
      </div>
      <div className="bar">
        <i className={`tone-${tone}`} style={{ width: `${metric.score}%` }} />
      </div>
      <div className="metric-foot">
        <small>{metric.area}</small>
        <small>신뢰도 {confidenceLabel(metric.confidence)}</small>
      </div>
      <ChevronRight />
    </button>
  );
}
