import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export function FeedbackButton({ analysis }) {
  const [copied, setCopied] = useState(false);

  async function copyFeedbackTemplate() {
    const focus = analysis
      ? [...analysis.metrics]
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map((metric) => `${metric.label} ${metric.score}`)
          .join(', ')
      : '분석 전';
    const template = [
      '[SkinCheck Lab 테스트 피드백]',
      `테스트 단계: ${analysis ? '분석 결과 확인' : '첫 화면/촬영 전'}`,
      analysis ? `종합 점수: ${analysis.overall}, 신뢰도: ${analysis.confidence}%` : '종합 점수: 없음',
      `관리 우선 항목: ${focus}`,
      '',
      '1. 촬영/사진 선택 과정에서 불편했던 점:',
      '',
      '2. 분석 결과가 납득된 부분:',
      '',
      '3. 분석 결과가 이상하거나 과장되어 보인 부분:',
      '',
      '4. 화장품 추천이 맞거나 틀려 보인 이유:',
      '',
      '5. 사용 기기/브라우저:',
      '',
      '6. 기타 의견:'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('아래 피드백 양식을 복사해 주세요.', template);
    }
  }

  return (
    <button className="feedback-button" onClick={copyFeedbackTemplate}>
      <MessageSquare />
      {copied ? '피드백 양식 복사됨' : '테스터 피드백 양식 복사'}
    </button>
  );
}
