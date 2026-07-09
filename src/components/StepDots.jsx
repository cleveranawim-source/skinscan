const STEPS = ['촬영', '확인', '분석'];

// 촬영→확인→분석이 각각 다른 화면이지만 하나의 연속된 흐름이라는 걸 보여주는 단계 표시.
export function StepDots({ step, onDark = false }) {
  return (
    <div className={`step-dots${onDark ? ' on-dark' : ''}`} aria-label={`${STEPS[step]} 단계 (${step + 1}/3)`}>
      {STEPS.map((label, i) => (
        <span key={label} className={i === step ? 'active' : ''}>
          {label}
        </span>
      ))}
    </div>
  );
}
