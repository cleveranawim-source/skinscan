import { Info, RotateCcw, ScanLine } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { GuideFrame } from './GuideFrame';

// 촬영 직후 확인 단계. 셔터를 누르자마자 분석으로 직행하면 사용자가 자기가 찍은 사진을
// 볼 기회가 없어서, 흐리거나 잘못 나온 사진인 걸 결과 화면에서야 알게 됩니다.
// 앨범 선택은 이미 사진을 보고 고른 것이므로 이 단계를 거치지 않습니다.
export function ReviewScreen({ imageUrl, onRetake, onConfirm }) {
  return (
    <main className="screen review-screen">
      <AppHeader title="사진 확인" onBack={onRetake} />
      <section className="quality-hero">
        <GuideFrame imageUrl={imageUrl} mode="guide" />
      </section>
      <section className="gate-copy">
        <Info />
        <p>얼굴이 선명하게 나왔는지, 타원 안에 잘 들어왔는지 확인해주세요. 흐리게 나왔다면 다시 촬영하는 편이 정확합니다.</p>
      </section>
      <div className="action-row quality-actions">
        <button className="secondary-button" onClick={onRetake}>
          <RotateCcw />
          다시 촬영
        </button>
        <button className="primary-button" onClick={onConfirm}>
          <ScanLine />
          이 사진으로 분석
        </button>
      </div>
    </main>
  );
}
