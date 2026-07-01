import { useEffect, useState } from 'react';
import { EmptyScreen } from './components/EmptyScreen';
import { CameraScreen } from './components/CameraScreen';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { QualityScreen } from './components/QualityScreen';
import { ReportScreen } from './components/ReportScreen';
import { DetailScreen } from './components/DetailScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { analyzeImage } from './lib/analysis';
import { readImage } from './lib/imageUtils';
import { getHistory, saveScan, clearHistory, importHistory } from './lib/history';

export function App() {
  const [stage, setStage] = useState('empty');
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [history, setHistory] = useState(() => getHistory());
  const [historyEntry, setHistoryEntry] = useState(null);
  const [historyMetric, setHistoryMetric] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 화면(stage)이 바뀔 때마다 스크롤을 맨 위로 되돌립니다.
  // 그렇지 않으면 직전 화면에서 스크롤해 내려간 위치가 다음 화면에 그대로 남습니다.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  async function runAnalysis(url, image) {
    setImageUrl(url);
    setAnalysis(null);
    setErrorMessage('');
    setStage('analyzing');
    try {
      const result = await analyzeImage(image);
      setAnalysis(result);
      setStage('quality');
    } catch (error) {
      setErrorMessage('사진을 분석하는 중 문제가 발생했습니다. 다른 사진으로 다시 시도해주세요.');
      setStage('empty');
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const { url, image } = await readImage(file);
    runAnalysis(url, image);
  }

  function handleCaptured(url, image) {
    runAnalysis(url, image);
  }

  function handleAnalyze() {
    if (analysis?.faceDetected) {
      setHistory(saveScan(analysis));
    }
    setStage('report');
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  function handleImportHistory(jsonText) {
    const result = importHistory(jsonText);
    setHistory(result.history);
    return result;
  }

  function openHistoryEntry(entry) {
    setHistoryEntry(entry);
    setHistoryMetric(null);
    setStage('historyReport');
  }

  function resetToEmpty() {
    setImageUrl('');
    setAnalysis(null);
    setSelectedMetric(null);
    setStage('empty');
  }

  let screen;
  if (stage === 'history') {
    screen = (
      <HistoryScreen
        history={history}
        onBack={() => setStage('empty')}
        onClear={handleClearHistory}
        onImport={handleImportHistory}
        onOpenEntry={openHistoryEntry}
      />
    );
  } else if (stage === 'historyDetail' && historyMetric && historyEntry) {
    screen = <DetailScreen metric={historyMetric} analysis={historyEntry} onBack={() => setStage('historyReport')} />;
  } else if (stage === 'historyReport' && historyEntry) {
    screen = (
      <ReportScreen
        imageUrl=""
        analysis={historyEntry}
        historical
        onBack={() => {
          setHistoryEntry(null);
          setStage('history');
        }}
        onSelect={(metric) => {
          setHistoryMetric(metric);
          setStage('historyDetail');
        }}
      />
    );
  } else if (stage === 'detail' && selectedMetric && analysis) {
    screen = <DetailScreen metric={selectedMetric} analysis={analysis} onBack={() => setStage('report')} />;
  } else if (stage === 'report' && analysis) {
    screen = (
      <ReportScreen
        imageUrl={imageUrl}
        analysis={analysis}
        onBack={() => setStage('quality')}
        onOpenHistory={() => setStage('history')}
        onSelect={(metric) => {
          setSelectedMetric(metric);
          setStage('detail');
        }}
      />
    );
  } else if (stage === 'quality' && analysis) {
    screen = (
      <QualityScreen
        imageUrl={imageUrl}
        analysis={analysis}
        onUpload={handleUpload}
        onAnalyze={handleAnalyze}
        onRetake={() => setStage('camera')}
        onReset={resetToEmpty}
      />
    );
  } else if (stage === 'analyzing') {
    screen = <AnalyzingScreen imageUrl={imageUrl} />;
  } else if (stage === 'camera') {
    screen = <CameraScreen onClose={() => setStage('empty')} onCaptured={handleCaptured} />;
  } else {
    screen = (
      <EmptyScreen
        onUpload={handleUpload}
        onOpenCamera={() => setStage('camera')}
        onOpenHistory={() => setStage('history')}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className="app-shell">
      <section className="phone-wrap">{screen}</section>
    </div>
  );
}
