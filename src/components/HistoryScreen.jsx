import { Info, Trash2 } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { TrendChart } from './TrendChart';
import { trendFor } from '../lib/history';

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function HistoryScreen({ history, onBack, onClear }) {
  const overallTrend = trendFor(history, 'overall');

  return (
    <main className="screen history-screen">
      <AppHeader title="분석 기록" onBack={onBack} />
      {history.length === 0 ? (
        <section className="empty-history">
          <Info />
          <p>아직 저장된 분석 기록이 없습니다. 리포트를 확인하면 점수만 이 기기에 저장됩니다.</p>
        </section>
      ) : (
        <>
          <section className="trend-card">
            <div className="section-title">
              <h2>종합 점수 추이</h2>
              <span>최근 {history.length}회</span>
            </div>
            <TrendChart points={overallTrend} />
          </section>
          <section className="history-list">
            {history.map((entry, index) => {
              const prev = history[index + 1];
              const delta = prev ? entry.overall - prev.overall : null;
              return (
                <article className="history-card" key={entry.id}>
                  <div className="history-score">
                    <strong>{entry.overall}</strong>
                    <span>{formatDate(entry.date)}</span>
                  </div>
                  <div className="history-meta">
                    <span>신뢰도 {entry.confidence}%</span>
                    {delta !== null && (
                      <span className={delta >= 0 ? 'delta-up' : 'delta-down'}>{delta > 0 ? `+${delta}` : delta}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
          <button className="secondary-button clear-history" onClick={onClear}>
            <Trash2 />
            기록 삭제
          </button>
        </>
      )}
      <p className="medical-note">기록은 이 브라우저에만 저장되며 사진은 포함되지 않습니다.</p>
    </main>
  );
}
