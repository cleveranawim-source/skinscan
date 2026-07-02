import { useEffect, useRef, useState } from 'react';
import { EmptyScreen } from './components/EmptyScreen';
import { CameraScreen } from './components/CameraScreen';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { QualityScreen } from './components/QualityScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ReportScreen } from './components/ReportScreen';
import { DetailScreen } from './components/DetailScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { TabBar } from './components/TabBar';
import { analyzeImage } from './lib/analysis';
import { readImage } from './lib/imageUtils';
import { getHistory, saveScan, clearHistory, importHistory } from './lib/history';

// 사진 품질이 이 점수 이상이고 차단 사유가 없으면 품질 게이트 화면을 건너뛰고
// 리포트로 직행합니다. 게이트는 "문제가 있을 때만" 끼어드는 화면입니다.
const AUTO_PASS_QUALITY = 72;

// 카메라·분석중·품질 게이트는 집중이 필요한 흐름이라 하단 탭을 숨깁니다.
const TABBED_STAGES = new Set(['empty', 'history', 'report', 'detail', 'historyReport', 'historyDetail']);

export function App() {
  const [stage, setStage] = useState('empty');
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [history, setHistory] = useState(() => getHistory());
  const [historyEntry, setHistoryEntry] = useState(null);
  const [historyMetric, setHistoryMetric] = useState(null);
  // 카메라 촬영 직후 확인 단계용. 사용자가 "이 사진으로 분석"을 눌러야 분석이 시작됩니다.
  const [captured, setCaptured] = useState(null);
  // 레이더 차트에 "지난번" 폴리곤을 겹치기 위한 직전 스캔. 저장 직전의 history[0]입니다.
  const [previousEntry, setPreviousEntry] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  // 같은 분석 결과가 히스토리에 두 번 저장되는 걸 막습니다. 리포트에서 뒤로 갔다가
  // "분석 실행"을 다시 누르면 analysis 객체는 그대로인데 saveScan이 또 호출되던 버그.
  const savedAnalysisRef = useRef(null);

  // 화면(stage)이 바뀔 때마다 스크롤을 맨 위로 되돌립니다.
  // 그렇지 않으면 직전 화면에서 스크롤해 내려간 위치가 다음 화면에 그대로 남습니다.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  function saveAnalysisOnce(result) {
    if (result?.faceDetected && savedAnalysisRef.current !== result) {
      setPreviousEntry(history[0] ?? null);
      setHistory(saveScan(result));
      savedAnalysisRef.current = result;
    }
  }

  async function runAnalysis(url, image) {
    setImageUrl(url);
    setAnalysis(null);
    setErrorMessage('');
    setStage('analyzing');
    try {
      const result = await analyzeImage(image);
      setAnalysis(result);
      if (!result.analysisBlocked && result.qualityScore >= AUTO_PASS_QUALITY) {
        saveAnalysisOnce(result);
        setStage('report');
      } else {
        setStage('quality');
      }
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
    setCaptured({ url, image });
    setStage('review');
  }

  function handleAnalyze() {
    saveAnalysisOnce(analysis);
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

  // 과거 리포트를 볼 때의 "지난번" = 그 기록 바로 이전(더 오래된) 기록.
  const historyEntryIndex = historyEntry ? history.findIndex((entry) => entry.id === historyEntry.id) : -1;
  const historyPrevious = historyEntryIndex >= 0 ? history[historyEntryIndex + 1] ?? null : null;

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
        previousEntry={historyPrevious}
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
        previousEntry={previousEntry}
        onBack={() => setStage('quality')}
        onOpenHistory={() => setStage('history')}
        onReviewQuality={() => setStage('quality')}
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
  } else if (stage === 'review' && captured) {
    screen = (
      <ReviewScreen
        imageUrl={captured.url}
        onRetake={() => setStage('camera')}
        onConfirm={() => runAnalysis(captured.url, captured.image)}
      />
    );
  } else if (stage === 'analyzing') {
    screen = <AnalyzingScreen imageUrl={imageUrl} />;
  } else if (stage === 'camera') {
    screen = <CameraScreen onClose={() => setStage('empty')} onCaptured={handleCaptured} />;
  } else {
    screen = (
      <EmptyScreen
        history={history}
        onUpload={handleUpload}
        onOpenCamera={() => setStage('camera')}
        onOpenEntry={openHistoryEntry}
        errorMessage={errorMessage}
      />
    );
  }

  const showTabBar = TABBED_STAGES.has(stage);
  const activeTab = stage.startsWith('history') ? 'history' : 'scan';

  return (
    <div className={`app-shell${showTabBar ? ' has-tabbar' : ''}`}>
      <section className="phone-wrap">{screen}</section>
      {showTabBar && (
        <TabBar
          active={activeTab}
          onScan={() => setStage('empty')}
          onHistory={() => setStage('history')}
        />
      )}
    </div>
  );
}
