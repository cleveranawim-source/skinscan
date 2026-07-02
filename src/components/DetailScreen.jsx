import { AppHeader } from './AppHeader';
import { scoreTone } from '../lib/analysis';
import { getInterpretation } from '../lib/interpretations';
import { getMetricDefinition, getMetricTier, TIER_META } from '../lib/metricDefinitions';

export function DetailScreen({ metric, analysis, onBack }) {
  const tone = scoreTone(metric.score);
  const interpretation = getInterpretation(metric.id, tone);
  // 과거 기록의 지표에는 tier/tierNote가 저장되어 있지 않을 수 있어 항상 정의에서 조회합니다.
  const tier = getMetricTier(metric.id);
  const tierNote = getMetricDefinition(metric.id)?.tierNote;
  return (
    <main className="screen detail-screen">
      <AppHeader title={metric.label} onBack={onBack} />
      <section className="detail-score-card">
        <div>
          <p className={`tone-${tone}`}>{metric.status}</p>
          <strong>{metric.score}</strong>
        </div>
        <span>
          <em className={`tier-badge tier-${tier}`}>{TIER_META[tier].label}</em>
          신뢰도 {metric.confidence}%
        </span>
      </section>
      {tierNote && (
        <section className={`explain-card${tier === 'experimental' ? ' warn' : ''}`}>
          <h2>이 지표를 얼마나 믿을 수 있나요</h2>
          <p>
            <b>{TIER_META[tier].label} 지표</b> — {tierNote}
          </p>
        </section>
      )}
      {interpretation && (
        <section className={`explain-card tone-card-${tone}`}>
          <h2>내 점수 해석</h2>
          <p>{interpretation}</p>
        </section>
      )}
      <section className="evidence-card">
        <h2>판단 근거</h2>
        <dl>
          <div>
            <dt>분석 부위</dt>
            <dd>{metric.area}</dd>
          </div>
          <div>
            <dt>분석 방법</dt>
            <dd>{metric.model}</dd>
          </div>
          <div>
            <dt>원시 단서</dt>
            <dd>{metric.raw}</dd>
          </div>
          <div>
            <dt>사진 기반 가능도</dt>
            <dd>{metric.reliable}</dd>
          </div>
        </dl>
      </section>
      <section className="explain-card">
        <h2>이 지표는 무엇을 보나요</h2>
        <p>{metric.description}</p>
      </section>
      <section className="explain-card warn">
        <h2>주의</h2>
        <p>{metric.caution}</p>
      </section>
      <section className="raw-card">
        <h2>이미지 신호</h2>
        <div>
          <span>밝기 {analysis.raw.avgLum}</span>
          <span>대비 {analysis.raw.contrast}</span>
          <span>반사 {analysis.raw.glareRatio}%</span>
          <span>붉은기 a* {analysis.raw.redRatio}</span>
          <span>국소 트러블 신호 {analysis.raw.blemishRatio}%</span>
        </div>
      </section>
    </main>
  );
}
