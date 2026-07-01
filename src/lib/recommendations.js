import { productCatalog } from './productCatalog';

export function buildRecommendations(analysis) {
  const weakMetrics = [...analysis.metrics].sort((a, b) => a.score - b.score);
  const focusIds = new Set(weakMetrics.slice(0, 3).map((metric) => metric.id));
  const ranked = productCatalog
    .map((product) => {
      const matches = product.fits.filter((id) => focusIds.has(id));
      return {
        ...product,
        matchCount: matches.length,
        matchedLabels: matches.map((id) => analysis.metrics.find((metric) => metric.id === id)?.label).filter(Boolean)
      };
    })
    .filter((product) => product.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name, 'ko'))
    .slice(0, 4);
  const blemishMetric = analysis.metrics.find((metric) => metric.id === 'blemish');

  return {
    focus: weakMetrics.slice(0, 3),
    products: ranked,
    avoid: [
      analysis.raw.glareRatio > 7
        ? '오일막이 강하게 남는 광택 제형은 피하세요.'
        : '새 제품을 여러 개 동시에 시작하지 마세요.',
      analysis.raw.redRatio > 5
        ? '고농도 산이나 레티노이드를 바로 도입하지 마세요.'
        : '강한 스크럽은 피하세요.',
      analysis.raw.contrast > 38
        ? '필링 패드를 매일 쓰지 마세요.'
        : '향이 강한 제품은 피하세요.',
      blemishMetric && blemishMetric.score < 55
        ? '국소 트러블 신호가 있는 부위는 손으로 만지거나 물리적으로 각질을 제거하지 마세요.'
        : '자기 전 두꺼운 옥클루시브 크림을 겹겹이 바르지 마세요.'
    ]
  };
}
