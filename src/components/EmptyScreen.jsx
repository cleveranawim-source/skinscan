import { AlertTriangle, Camera, CheckCircle2, History, ImagePlus, Lock, ShieldCheck } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';
import { FeedbackButton } from './FeedbackButton';
import { protocolSteps } from '../lib/constants';

export function EmptyScreen({ onUpload, onOpenCamera, onOpenHistory, errorMessage }) {
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
      <section className="capture-hero">
        <div>
          <p>PHOTO-BASED SKIN CHECK</p>
          <h2>촬영 품질부터 엄격하게 확인합니다.</h2>
          <span>사진 한 장으로 단정하지 않고, 조명과 선명도에 따라 결과 신뢰도를 낮춰 표시합니다.</span>
        </div>
      </section>
      <div className="capture-actions primary-entry">
        <button className="primary-button" onClick={onOpenCamera}>
          <Camera />
          촬영 시작
        </button>
        <label className="secondary-upload">
          <ImagePlus />
          앨범에서 선택
          <input type="file" accept="image/*" onChange={onUpload} />
        </label>
      </div>
      <section className="capture-preview-panel">
        <GuideFrame mode="guide" />
        <div className="capture-checklist">
          {protocolSteps.map((step) => (
            <span key={step}>
              <CheckCircle2 />
              {step}
            </span>
          ))}
        </div>
      </section>
      <section className="trust-panel compact">
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
      </section>
      <FeedbackButton />
      <p className="medical-note">미용 관리 참고용이며 질병 진단이나 치료 판단을 대신하지 않습니다.</p>
    </main>
  );
}
