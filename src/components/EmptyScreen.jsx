import { AlertTriangle, Camera, CheckCircle2, ChevronRight, History, ImagePlus, Lock, ShieldCheck } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { FeedbackButton } from './FeedbackButton';
import { TrendChart } from './TrendChart';
import { protocolSteps } from '../lib/constants';
import { metricDefinitions } from '../lib/metricDefinitions';
import { hasFullReport, trendFor } from '../lib/history';
import { scoreTone } from '../lib/analysis';

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
  const trend = trendFor(history, 'overall');
  const openable = hasFullReport(latest);

  return (
    <section className={`dashboard-card tone-border-${scoreTone(latest.overall)}`}>
      <div className="dash-top">
        <span>마지막 분석 · {relativeDay(latest.date)}</span>
        {delta !== null && (
          <span className={delta >= 0 ? 'delta-up' : 'delta-down'}>
            지난번보다 {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <div className="dash-score">
        <strong>{latest.overall}</strong>
        <span>종합 피부 컨디션 · 신뢰도 {latest.confidence}%</span>
      </div>
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

export function EmptyScreen({ history = [], onUpload, onOpenCamera, onOpenHistory, onOpenEntry, errorMessage }) {
  const isReturning = history.length > 0;

  return (
    <main className="screen capture-screen">
      <AppHeader
        title="SkinScan"
        rightAction={
          <button className="icon-button" onClick={onOpenHistory} aria-label="분석 기록 보기">
            <History />
          </button>
        }
      />
      {errorMessage && (
        <section className="inline-alert">
          <AlertTriangle />
          <p>{errorMessage}</p>
        </section>
      )}

      {isReturning ? (
        <DashboardCard history={history} onOpenEntry={onOpenEntry} />
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
