import { AlertTriangle, CheckCircle2, ChevronRight, RotateCcw, ScanLine } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';
import { StepDots } from './StepDots';
import { confidenceLabel } from '../lib/analysis';

const AUTO_PASS_QUALITY = 72;

// 촬영 직후 확인 단계. 셔터를 누르자마자 분석으로 직행하면 사용자가 자기가 찍은 사진의
// 품질을 결과 화면에서야 알게 됩니다. 그래서 셔터를 누른 순간 백그라운드로 품질을 미리
// 계산해두고(App.jsx의 handleCaptured), 여기서는 그 결과를 보여줘 "다시 찍을지"를
// 감이 아니라 실제 점수/신뢰도로 판단하게 합니다. 앨범 선택은 이미 사진을 보고 고른
// 것이므로 이 단계를 거치지 않습니다.
export function ReviewScreen({ imageUrl, analysis, analysisFailed, onRetake, onConfirm, onViewDetails }) {
  const loading = !analysis && !analysisFailed;
  const blocked = Boolean(analysis?.analysisBlocked);
  const passed = Boolean(analysis) && !blocked && analysis.qualityScore >= AUTO_PASS_QUALITY;
  const gateLabel = !analysis ? '' : blocked ? '분석 불가' : passed ? '분석 가능' : '제한적 분석';
  const passCount = analysis?.quality?.filter((item) => item.pass).length ?? 0;
  const totalCount = analysis?.quality?.length ?? 0;

  return (
    <main className="screen review-screen">
      <AppHeader title="사진 확인" onBack={onRetake} />
      <StepDots step={1} />
      <section className="quality-hero">
        <GuideFrame imageUrl={imageUrl} mode="scan" />
        <div className="quality-verdict">
          {loading ? (
            <>
              <p>품질 확인 중…</p>
              <div className="spinner" aria-hidden="true" />
            </>
          ) : analysisFailed ? (
            <>
              <p>사진 품질</p>
              <span className="status-warn">확인 실패</span>
            </>
          ) : (
            <>
              <p>사진 품질</p>
              <strong>{analysis.qualityScore}</strong>
              <span className={passed ? 'status-good' : 'status-warn'}>{gateLabel}</span>
            </>
          )}
        </div>
      </section>

      {loading && (
        <section className="gate-copy">
          <ScanLine />
          <p>얼굴 위치와 선명도를 확인하고 있어요. 잠시만 기다려주세요.</p>
        </section>
      )}

      {analysisFailed && (
        <section className="face-alert">
          <AlertTriangle />
          <div>
            <strong>사진 품질을 자동으로 확인하지 못했습니다.</strong>
            <p>육안으로 얼굴이 선명하게, 타원 안에 잘 들어왔는지 확인한 뒤 진행하거나 다시 촬영해주세요.</p>
          </div>
        </section>
      )}

      {!loading && !analysisFailed && !analysis.faceDetected && (
        <section className="face-alert">
          <AlertTriangle />
          <div>
            <strong>{analysis.faceMeshError ? '얼굴 인식 기능을 불러오지 못했습니다.' : '사진에서 얼굴을 찾지 못했습니다.'}</strong>
            <p>
              {analysis.faceMeshError
                ? '브라우저를 최신 버전으로 업데이트하거나 다른 기기/브라우저로 다시 시도해주세요.'
                : '정면으로, 얼굴이 프레임 중앙에 크게 나오도록 다시 촬영해주세요.'}
            </p>
          </div>
        </section>
      )}

      {!loading && !analysisFailed && analysis.faceDetected && blocked && (
        <section className="face-alert">
          <AlertTriangle />
          <div>
            <strong>
              {analysis.colorInsufficient
                ? '색 정보가 거의 없는 사진입니다.'
                : analysis.criticalFailures?.length > 0
                  ? `${analysis.criticalFailures.join(', ')} 상태가 심각합니다.`
                  : '사진 품질이 낮아 분석할 수 없습니다.'}
            </strong>
            <p>이 사진으로는 결과를 믿을 수 없어 분석을 막았어요. 다시 촬영해주세요.</p>
          </div>
        </section>
      )}

      {!loading && !analysisFailed && analysis.faceDetected && !blocked && (
        <section className="gate-copy">
          <CheckCircle2 />
          <p>
            {passCount}/{totalCount}개 조건 통과 · 신뢰도 {analysis.confidence}% ({confidenceLabel(analysis.confidence)})
            {passed ? ' — 이 사진으로 바로 리포트를 볼 수 있어요.' : ' — 분석은 되지만 신뢰도가 낮아요. 가능하면 다시 촬영해주세요.'}
          </p>
        </section>
      )}

      {!loading && !analysisFailed && (
        <button className="quality-chip" onClick={onViewDetails}>
          <CheckCircle2 />
          품질 항목 {passCount}/{totalCount}개 자세히 보기
          <ChevronRight />
        </button>
      )}

      <div className="action-row quality-actions">
        <button className="secondary-button" onClick={onRetake}>
          <RotateCcw />
          다시 촬영
        </button>
        <button className="primary-button" onClick={onConfirm} disabled={loading || blocked}>
          <ScanLine />
          {loading ? '확인 중…' : '이 사진으로 분석'}
        </button>
      </div>
    </main>
  );
}
