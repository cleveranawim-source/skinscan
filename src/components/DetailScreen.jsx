import { AppHeader } from './AppHeader';

export function DetailScreen({ metric, analysis, onBack }) {
  return (
    <main className="screen detail-screen">
      <AppHeader title={metric.label} onBack={onBack} />
      <section className="detail-score-card">
        <div>
          <p>{metric.status}</p>
          <strong>{metric.score}</strong>
        </div>
        <span>신뢰도 {metric.confidence}%</span>
      </section>
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
        <h2>해석</h2>
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
        </div>
      </section>
    </main>
  );
}
