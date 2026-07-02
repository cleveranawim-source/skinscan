import { useState } from 'react';
import { ChevronRight, Download, Info, Trash2, Upload } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { TrendChart } from './TrendChart';
import { deltaDisplay, formatHistoryDate, hasFullReport, serializeHistory, trendFor } from '../lib/history';

export function HistoryScreen({ history, onBack, onClear, onImport, onOpenEntry }) {
  const overallTrend = trendFor(history, 'overall');
  const [importMessage, setImportMessage] = useState('');

  function handleExport() {
    const blob = new Blob([serializeHistory(history)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skinscan-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    const result = onImport(text);
    setImportMessage(
      result.failed
        ? '파일 형식을 읽을 수 없습니다.'
        : result.imported > 0
          ? `${result.imported}개 항목을 가져왔습니다.`
          : '새로 추가할 항목이 없습니다. 이미 있는 기록이에요.'
    );
    window.setTimeout(() => setImportMessage(''), 3200);
  }

  return (
    <main className="screen history-screen">
      <AppHeader title="분석 기록" onBack={onBack} />

      <div className="action-row history-io">
        <button className="secondary-button" onClick={handleExport} disabled={history.length === 0}>
          <Download />
          내보내기
        </button>
        <label className="secondary-upload">
          <Upload />
          가져오기
          <input type="file" accept="application/json,.json" onChange={handleImportFile} />
        </label>
      </div>
      {importMessage && (
        <section className="inline-alert">
          <Info />
          <p>{importMessage}</p>
        </section>
      )}

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
              const deltaInfo = deltaDisplay(prev ? entry.overall - prev.overall : null);
              const clickable = hasFullReport(entry);
              const Tag = clickable ? 'button' : 'article';
              return (
                <Tag
                  className="history-card"
                  key={entry.id}
                  onClick={clickable ? () => onOpenEntry(entry) : undefined}
                >
                  <div className="history-score">
                    <strong>{entry.overall}</strong>
                    <span>{formatHistoryDate(entry.date)}</span>
                    {!clickable && <small className="history-legacy">요약만 저장됨</small>}
                  </div>
                  <div className="history-meta">
                    <span>신뢰도 {entry.confidence}%</span>
                    {deltaInfo && (
                      <span className={deltaInfo.cls}>{deltaInfo.cls === 'delta-flat' ? '비슷' : deltaInfo.text}</span>
                    )}
                    {clickable && <ChevronRight />}
                  </div>
                </Tag>
              );
            })}
          </section>
          <button className="secondary-button clear-history" onClick={onClear}>
            <Trash2 />
            기록 삭제
          </button>
        </>
      )}
      <p className="medical-note">기록은 이 브라우저에만 저장되며 사진은 포함되지 않습니다. 내보내기 파일로 다른 기기에 옮기거나 백업할 수 있어요.</p>
    </main>
  );
}
