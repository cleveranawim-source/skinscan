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
  return {
    focus: weakMetrics.slice(0, 3),
    products: ranked,
    avoid: [
      analysis.raw.glareRatio > 7 ? '강한 오일막/광택 제형' : '새 제품을 여러 개 동시에 시작하기',
      analysis.raw.redRatio > 5 ? '고농도 산/레티노이드의 즉시 도입' : '강한 스크럽',
      analysis.raw.contrast > 38 ? '필링 패드 매일 사용' : '향이 강한 제품'
    ]
  };
}
