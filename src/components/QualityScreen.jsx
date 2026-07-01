import { AlertTriangle, CheckCircle2, Info, RotateCcw, ScanLine } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';

export function QualityScreen({ imageUrl, analysis, onUpload, onAnalyze, onRetake, onReset }) {
  const passCount = analysis.quality.filter((item) => item.pass).length;
  const totalCount = analysis.quality.length;
  const gateLabel = analysis.analysisBlocked ? '분석 불가' : analysis.qualityScore >= 72 ? '분석 가능' : '제한적 분석';

  return (
    <main className="screen quality-screen">
      <AppHeader title="촬영 품질" onBack={onReset} />
      <section className="quality-hero">
        <GuideFrame imageUrl={imageUrl} mode={analysis.faceDetected ? 'scan' : 'guide'} />
        <div className="quality-verdict">
          <p>사진 품질</p>
          <strong>{analysis.qualityScore}</strong>
          <span className={!analysis.analysisBlocked && analysis.qualityScore >= 72 ? 'status-good' : 'status-warn'}>{gateLabel}</span>
        </div>
      </section>

      {!analysis.faceDetected && (
        <section className="face-alert">
          <AlertTriangle />
          <div>
            <strong>{analysis.faceMeshError ? '얼굴 인식 기능을 불러오지 못했습니다.' : '사진에서 얼굴을 찾지 못했습니다.'}</strong>
            <p>
              {analysis.faceMeshError
                ? '브라우저를 최신 버전으로 업데이트하거나 다른 기기/브라우저로 다시 시도해주세요.'
                : '정면으로, 얼굴이 프레임 중앙에 크게 나오도록 다시 촬영하거나 다른 사진을 선택해주세요.'}
            </p>
          </div>
        </section>
      )}

      {analysis.faceDetected && analysis.analysisBlocked && (
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
            <p>
              {analysis.colorInsufficient
                ? '흑백이거나 채도가 매우 낮으면 홍조·톤처럼 색을 기준으로 하는 지표를 계산할 수 없습니다. 필터 없는 컬러 사진으로 다시 시도해주세요.'
                : analysis.criticalFailures?.length > 0
                  ? '이 항목 하나만 심각하게 나빠도, 다른 조건이 좋아도 결과를 믿을 수 없어 분석을 막습니다. 아래 항목을 참고해 다시 촬영해주세요.'
                  : '통과하지 못한 항목이 많아 결과를 신뢰하기 어렵습니다. 아래 항목을 참고해 다시 촬영해주세요.'}
            </p>
          </div>
        </section>
      )}

      <section className="quality-grid">
        {analysis.quality.map((item) => (
          <div className={`quality-card-v2 ${item.pass ? 'pass' : 'warn'}`} key={item.id}>
            {item.pass ? <CheckCircle2 /> : <AlertTriangle />}
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </section>
      <section className="gate-copy">
        <Info />
        <p>
          {passCount}/{totalCount}개 조건이 통과되었습니다. 통과하지 못한 항목은 결과의 신뢰도를 자동으로 낮춥니다.
        </p>
      </section>
      <div className="action-row quality-actions">
        <button className="secondary-button" onClick={onRetake}>
          <RotateCcw />
          다시 촬영
        </button>
        <button className="primary-button" onClick={onAnalyze} disabled={analysis.analysisBlocked}>
          <ScanLine />
          분석 실행
        </button>
      </div>
      <label className="text-upload">
        앨범 사진으로 변경
        <input type="file" accept="image/*" onChange={onUpload} />
      </label>
    </main>
  );
}
