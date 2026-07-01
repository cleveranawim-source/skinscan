import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';

export function AnalyzingScreen({ imageUrl }) {
  return (
    <main className="screen analyzing-screen">
      <AppHeader title="분석 중" />
      <section className="quality-hero">
        <GuideFrame imageUrl={imageUrl} mode="scan" />
      </section>
      <section className="analyzing-status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <div>
          <strong>얼굴 위치를 확인하고 있습니다…</strong>
          <p>처음 실행할 때는 인식 모델을 불러오느라 몇 초 더 걸릴 수 있어요.</p>
        </div>
      </section>
    </main>
  );
}
