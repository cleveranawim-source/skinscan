import { History, ScanFace } from 'lucide-react';

// 하단 탭: 스캔(홈/리포트 흐름)과 기록(히스토리 흐름) 두 갈래.
// 카메라·분석중·품질 게이트처럼 집중이 필요한 화면에서는 App에서 아예 렌더링하지 않습니다.
export function TabBar({ active, onScan, onHistory }) {
  return (
    <nav className="tab-bar" aria-label="주 메뉴">
      <button className={active === 'scan' ? 'tab-active' : ''} onClick={onScan} aria-current={active === 'scan' ? 'page' : undefined}>
        <ScanFace />
        <span>스캔</span>
      </button>
      <button className={active === 'history' ? 'tab-active' : ''} onClick={onHistory} aria-current={active === 'history' ? 'page' : undefined}>
        <History />
        <span>기록</span>
      </button>
    </nav>
  );
}
