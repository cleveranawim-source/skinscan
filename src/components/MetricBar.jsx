import { ChevronRight } from 'lucide-react';
import { confidenceLabel, scoreTone } from '../lib/analysis';
import { getMetricTier, TIER_META } from '../lib/metricDefinitions';

export function MetricBar({ metric, onSelect }) {
  const tone = scoreTone(metric.score);
  // 과거 기록에는 tier가 저장되어 있지 않으므로 id로 조회합니다.
  const tier = getMetricTier(metric.id);
  return (
    <button className="metric-card" onClick={() => onSelect(metric)}>
      <div className="metric-head">
        <span>
          {metric.label}
          <em className={`tier-badge tier-${tier}`}>{TIER_META[tier].label}</em>
        </span>
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
