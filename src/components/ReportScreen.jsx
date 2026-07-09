import { AlertTriangle, CheckCircle2, History, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';
import { MetricBar } from './MetricBar';
import { FeedbackButton } from './FeedbackButton';
import { RadarChart } from './RadarChart';
import { confidenceLabel, scoreTone } from '../lib/analysis';
import { buildRecommendations } from '../lib/recommendations';
import { catalogReviewStatus, catalogUpdatedAt } from '../lib/productCatalog';
import { formatHistoryDate, lightingComparability } from '../lib/history';
import { getMetricTier, TIER_META } from '../lib/metricDefinitions';

const VERDICT_BY_TONE = {
  good: '전반적으로 안정적입니다.',
  ok: '양호한 편이지만 관리 포인트가 있습니다.',
  watch: '관리 우선순위를 정해야 합니다.',
  warn: '촬영 조건과 피부 신호를 다시 확인해야 합니다.'
};

const TABS = [
  { id: 'summary', label: '요약' },
  { id: 'detail', label: '상세' },
  { id: 'care', label: '케어' }
];

// 리포트는 "오늘 어때?(요약) / 무엇을 근거로?(상세) / 뭘 하면 돼?(케어)" 세 질문에
// 각각 탭 하나씩 대응합니다. 8개 섹션 단일 스크롤이 너무 길어서 나눴습니다.
export function ReportScreen({ imageUrl, analysis, previousEntry, onBack, onSelect, onOpenHistory, onReviewQuality, historical, tab = 'summary', onTabChange }) {
  // 우선 관리/상대적 안정은 실험적 지표(피부결·잔주름)를 제외하고 뽑습니다.
  // 사진 노이즈에 휘둘리는 지표가 "가장 시급한 관리 포인트"로 올라오면 안 되기 때문입니다.
  const trusted = analysis.metrics.filter((metric) => getMetricTier(metric.id) !== 'experimental');
  const weakest = [...trusted].sort((a, b) => a.score - b.score).slice(0, 2);
  // 신뢰 지표가 5개뿐이라 점수가 비슷하면 같은 지표가 양쪽에 다 뽑힐 수 있어, 우선 관리로
  // 뽑힌 지표는 안정 후보에서 제외합니다.
  const weakestIds = new Set(weakest.map((metric) => metric.id));
  const stable = trusted
    .filter((metric) => !weakestIds.has(metric.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const recommendations = analysis.recommendations || buildRecommendations(analysis);
  const tone = scoreTone(analysis.overall);
  const comparability = previousEntry ? lightingComparability(analysis.raw, previousEntry.raw) : null;

  return (
    <main className="screen report-screen">
      <AppHeader
        title={historical ? '지난 기록' : '오늘의 기록'}
        onBack={onBack}
        rightAction={
          onOpenHistory && (
            <button className="icon-button" onClick={onOpenHistory} aria-label="분석 기록 보기">
              <History />
            </button>
          )
        }
      />
      {historical && (
        <section className="inline-alert historical-banner">
          <ShieldCheck />
          <p>지난 기록입니다 · {formatHistoryDate(analysis.date)} · 사진은 저장되지 않아 표시되지 않습니다.</p>
        </section>
      )}

      <div className="segmented" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => onTabChange?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <>
          <section className={`report-hero tone-${tone}`}>
            <div>
              <p>종합 피부 컨디션</p>
              <strong>{analysis.overall}</strong>
              <span>
                신뢰도 {analysis.confidence}% · {confidenceLabel(analysis.confidence)}
              </span>
            </div>
            <div className="verdict-copy">
              <b>{VERDICT_BY_TONE[tone]}</b>
              <span>사진 품질과 항목별 신뢰도를 함께 반영한 참고 결과입니다.</span>
            </div>
          </section>

          {analysis.qualityScore !== undefined && (
            onReviewQuality ? (
              <button className="quality-chip" onClick={onReviewQuality}>
                <CheckCircle2 />
                사진 품질 {analysis.qualityScore} · {analysis.quality?.filter((q) => q.pass).length}/{analysis.quality?.length}개 통과 · 자세히 보기
              </button>
            ) : (
              <div className="quality-chip static">
                <CheckCircle2 />
                사진 품질 {analysis.qualityScore} · {analysis.quality?.filter((q) => q.pass).length}/{analysis.quality?.length}개 통과
              </div>
            )
          )}

          <section className="radar-card">
            <div className="section-title">
              <h2>한눈에 보기</h2>
              <span>바깥쪽일수록 좋은 상태</span>
            </div>
            <RadarChart metrics={analysis.metrics} previousMetrics={previousEntry?.metrics} />
            {comparability && !comparability.comparable && (
              <p className="compare-warning">
                지난번과 촬영 조건({comparability.issues.join('·')})이 달라, 두 결과의 차이는 피부 변화가 아니라 조명 차이일 수 있어요.
              </p>
            )}
          </section>

          <section className="report-priority">
            <div>
              <span>우선 관리</span>
              {weakest.map((metric) => (
                <b key={metric.id}>{metric.label}</b>
              ))}
            </div>
            <div>
              <span>상대적 안정</span>
              {stable.map((metric) => (
                <b key={metric.id}>{metric.label}</b>
              ))}
            </div>
            <p className="priority-note">피부결·잔주름 같은 실험적 지표는 사진 상태에 민감해 우선순위 선정에서 제외됩니다.</p>
          </section>
        </>
      )}

      {tab === 'detail' && (
        <>
          {imageUrl && <GuideFrame imageUrl={imageUrl} mode="analysis" rois={analysis.rois} />}
          <section className="metric-list">
            <div className="section-title">
              <h2>항목별 결과</h2>
              <span>점수와 신뢰도를 함께 보세요</span>
            </div>
            <div className="tier-legend">
              {Object.entries(TIER_META).map(([key, meta]) => (
                <span key={key}>
                  <em className={`tier-badge tier-${key}`}>{meta.label}</em>
                  {meta.summary}
                </span>
              ))}
            </div>
            {analysis.metrics.map((metric) => (
              <MetricBar metric={metric} key={metric.id} onSelect={onSelect} />
            ))}
          </section>
        </>
      )}

      {tab === 'care' && (
        <>
          <section className="recommend-card">
            <div className="recommend-title">
              <SlidersHorizontal />
              <div>
                <h2>한국 화장품 추천</h2>
                <p>점수가 낮은 항목과 제형 리스크를 기준으로 고른 후보입니다.</p>
              </div>
            </div>
            <div className="catalog-meta">
              <ShieldCheck />
              <span>
                성분 후보 정보 갱신일 {catalogUpdatedAt} · {catalogReviewStatus}
              </span>
            </div>
            <div className="focus-row">
              {recommendations.focus.map((metric) => (
                <span key={metric.id}>
                  {metric.label} {metric.score}
                </span>
              ))}
            </div>
            <div className="product-list">
              {recommendations.products.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-card-head">
                    <span>{product.category}</span>
                    {product.tier === 'A' && <span className="award-badge">2025 올리브영 어워즈</span>}
                  </div>
                  <h3>{product.name}</h3>
                  <strong>{product.strength}</strong>
                  <p>{product.reason}</p>
                  <small>맞는 신호: {product.matchedLabels.join(', ')}</small>
                  <em>{product.caution}</em>
                </article>
              ))}
            </div>
            <div className="avoid-box">
              <strong>이번 결과에서 피할 것</strong>
              {recommendations.avoid.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
          <section className="limitation-card">
            <AlertTriangle />
            <p>화장품 추천은 진단이 아니라 성분/제형 후보입니다. 전성분 변경, 개인 알레르기, 기존 처방약과의 충돌 가능성은 구매 전 반드시 확인하세요.</p>
          </section>
        </>
      )}

      {!historical && <FeedbackButton analysis={analysis} />}
    </main>
  );
}
