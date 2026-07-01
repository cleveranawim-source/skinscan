import { AlertTriangle, CheckCircle2, Info, RotateCcw, ScanLine } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';

export function QualityScreen({ imageUrl, analysis, onUpload, onAnalyze, onRetake, onReset }) {
  const passCount = analysis.quality.filter((item) => item.pass).length;
  const totalCount = analysis.quality.length;
  const gateLabel = !analysis.faceDetected
    ? '분석 불가'
    : analysis.qualityScore >= 72
      ? '분석 가능'
      : analysis.qualityScore >= 55
        ? '제한적 분석'
        : '재촬영 권장';

  return (
    <main className="screen quality-screen">
      <AppHeader title="촬영 품질" onBack={onReset} />
      <section className="quality-hero">
        <GuideFrame imageUrl={imageUrl} mode={analysis.faceDetected ? 'scan' : 'guide'} />
        <div className="quality-verdict">
          <p>사진 품질</p>
          <strong>{analysis.qualityScore}</strong>
          <span className={analysis.faceDetected && analysis.qualityScore >= 72 ? 'status-good' : 'status-warn'}>{gateLabel}</span>
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
        <button className="primary-button" onClick={onAnalyze} disabled={!analysis.faceDetected}>
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
