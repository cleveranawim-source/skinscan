import { ChevronRight } from 'lucide-react';
import { confidenceLabel } from '../lib/analysis';

export function MetricBar({ metric, onSelect }) {
  return (
    <button className="metric-card" onClick={() => onSelect(metric)}>
      <div className="metric-head">
        <span>{metric.label}</span>
        <strong>{metric.score}</strong>
      </div>
      <div className="bar">
        <i style={{ width: `${metric.score}%` }} />
      </div>
      <div className="metric-foot">
        <small>{metric.area}</small>
        <small>신뢰도 {confidenceLabel(metric.confidence)}</small>
      </div>
      <ChevronRight />
    </button>
  );
}
