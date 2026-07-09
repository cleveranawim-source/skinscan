import { AlertTriangle, Camera, CheckCircle2, ChevronRight, ImagePlus, Lock, ShieldCheck } from 'lucide-react';
import { FeedbackButton } from './FeedbackButton';
import { TrendChart } from './TrendChart';
import { Sparkline } from './Sparkline';
import { protocolSteps } from '../lib/constants';
import { metricDefinitions } from '../lib/metricDefinitions';
import { currentWeekStrip, deltaDisplay, hasFullReport, lightingComparability, scanDayCount, trendFor } from '../lib/history';
import { scoreTone } from '../lib/analysis';

// 홈에 추세를 노출하는 핵심 3지표. 증거 등급이 '핵심'인 지표만 씁니다 —
// 실험적 지표(피부결·잔주름)의 등락을 첫 화면에서 신호처럼 보여주지 않기 위해서입니다.
const CORE_TREND_IDS = ['redness', 'tone', 'shine'];

function relativeDay(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 30) return `${days}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 재방문자의 첫 화면: 소개 문구 대신 지난 결과 요약과 추이를 보여줍니다.
function DashboardCard({ history, onOpenEntry }) {
  const latest = history[0];
  const prev = history[1];
  const delta = prev ? latest.overall - prev.overall : null;
  const deltaInfo = deltaDisplay(delta);
  const comparability = prev ? lightingComparability(latest.raw, prev.raw) : null;
  const trend = trendFor(history, 'overall');
  const openable = hasFullReport(latest);

  return (
    <section className={`dashboard-card tone-border-${scoreTone(latest.overall)}`}>
      <div className="dash-top">
        <span>마지막 분석 · {relativeDay(latest.date)}</span>
        {deltaInfo && (
          <span className={deltaInfo.cls}>
            {deltaInfo.cls === 'delta-flat' ? `지난번과 ${deltaInfo.text}` : `지난번보다 ${deltaInfo.text}`}
          </span>
        )}
      </div>
      <div className="dash-score">
        <strong>{latest.overall}</strong>
        <span>종합 피부 컨디션 · 신뢰도 {latest.confidence}%</span>
      </div>
      {comparability && !comparability.comparable && (
        <p className="compare-warning">
          지난번과 촬영 조건({comparability.issues.join('·')})이 달라 점수 비교의 정확도가 낮아요.
        </p>
      )}
      {trend.length >= 2 && <TrendChart points={trend} />}
      {openable && (
        <button className="dash-report-link" onClick={() => onOpenEntry(latest)}>
          지난 리포트 다시 보기
          <ChevronRight />
        </button>
      )}
    </section>
  );
}

// 이번 주(월~일) 스캔 여부를 점으로 보여주는 스트립. "기록이 쌓이는 앱"이라는
// 정체성을 첫 화면에서 만드는 장치입니다.
function WeekStrip({ history }) {
  const days = currentWeekStrip(history);
  return (
    <section className="week-card" aria-label="이번 주 기록 현황">
      {days.map((day) => (
        <div className="week-day" key={day.label}>
          <p>{day.label}</p>
          <span
            className={
              day.scanned
                ? 'dot dot-done'
                : day.isToday
                  ? 'dot dot-today'
                  : day.isFuture
                    ? 'dot dot-future'
                    : 'dot'
            }
          />
        </div>
      ))}
    </section>
  );
}

// 핵심 지표 3개의 미니 추세. 2회 이상 기록된 지표만 줄이 생깁니다.
function CoreTrends({ history }) {
  const rows = CORE_TREND_IDS.map((id) => {
    const definition = metricDefinitions.find((metric) => metric.id === id);
    const points = trendFor(history, id);
    return { id, label: definition?.label ?? id, points };
  }).filter((row) => row.points.length >= 2);

  if (rows.length === 0) {
    return (
      <section className="core-trends empty">
        <p>이틀 이상 기록하면 핵심 지표의 추세가 여기에 보여요.</p>
      </section>
    );
  }
  return (
    <section className="core-trends" aria-label="핵심 지표 추세">
      {rows.map((row) => (
        <div className="core-trend-row" key={row.id}>
          <span>{row.label}</span>
          <Sparkline points={row.points} />
          <strong>{row.points[row.points.length - 1].score}</strong>
        </div>
      ))}
    </section>
  );
}

export function EmptyScreen({ history = [], onUpload, onOpenCamera, onOpenEntry, errorMessage }) {
  const isReturning = history.length > 0;

  return (
    <main className="screen capture-screen">
      {/* 홈에서만 브랜드 워드마크(가운데 정렬, 명조 세리프).
          기록 진입은 하단 탭이 담당하므로 헤더 우측 아이콘은 없습니다. */}
      <header className="app-header brand-header">
        <h1>
          <span className="brand-skin">Skin</span>
          <span className="brand-scan">Scan</span>
        </h1>
      </header>
      {errorMessage && (
        <section className="inline-alert">
          <AlertTriangle />
          <p>{errorMessage}</p>
        </section>
      )}

      {isReturning ? (
        <>
          <div className="diary-head">
            <span className="diary-date">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
            <span className="streak-chip">기록 {scanDayCount(history)}일째</span>
          </div>
          <DashboardCard history={history} onOpenEntry={onOpenEntry} />
          <WeekStrip history={history} />
          <CoreTrends history={history} />
        </>
      ) : (
        <section className="capture-hero">
          <div>
            <p>PHOTO-BASED SKIN CHECK</p>
            <h2>오늘 피부, 사진 한 장으로 확인</h2>
            <span>이마·볼·코·눈가·턱을 얼굴 인식으로 찾아 부위별로 점수를 매깁니다. 조명이나 선명도가 부족하면 신뢰도를 낮춰 보여드려요.</span>
          </div>
        </section>
      )}

      <div className="capture-actions primary-entry">
        <button className="primary-button" onClick={onOpenCamera}>
          <Camera />
          {isReturning ? '오늘 피부 스캔' : '촬영 시작'}
        </button>
        <label className="secondary-upload">
          <ImagePlus />
          앨범에서 선택
          <input type="file" accept="image/*" onChange={onUpload} />
        </label>
      </div>

      <section className="metric-preview-section">
        <div className="section-title">
          <h2>이런 걸 확인해요</h2>
          <span>{metricDefinitions.length}개 항목 · 신뢰도 함께 표시</span>
        </div>
        <div className="focus-row">
          {metricDefinitions.map((metric) => (
            <span key={metric.id}>{metric.label}</span>
          ))}
        </div>
      </section>

      <section className="capture-preview-panel">
        <div className="section-title">
          <h2>촬영 가이드</h2>
          <span>정확도를 높이는 팁</span>
        </div>
        <div className="protocol-inline">
          {protocolSteps.map((step) => (
            <span key={step}>
              <CheckCircle2 />
              {step}
            </span>
          ))}
        </div>
      </section>

      <section className="trust-section">
        <div className="section-title">
          <h2>안전하게 설계했어요</h2>
        </div>
        <div className="trust-panel compact">
          <div>
            <ShieldCheck />
            <strong>AI 얼굴 인식 후 부위별 분석</strong>
            <p>이마·볼·코·눈가·턱 위치를 얼굴 인식으로 찾아 그 부위에서만 점수를 계산합니다.</p>
          </div>
          <div>
            <Lock />
            <strong>브라우저 내부 처리</strong>
            <p>사진과 인식 모델 모두 서버로 전송되지 않고 이 기기 안에서만 처리됩니다.</p>
          </div>
        </div>
      </section>
      <FeedbackButton />
      <p className="medical-note">미용 관리 참고용이며 질병 진단이나 치료 판단을 대신하지 않습니다.</p>
    </main>
  );
}
