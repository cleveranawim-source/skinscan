# Product Recommendation Policy

SkinCheck Lab recommends Korean cosmetics candidates conservatively.

## Recommendation Principles

1. Start from visible skin signals, not product popularity.
2. Prefer low-risk categories before strong actives.
3. Recommend product candidates, not guaranteed solutions.
4. Show cautions next to every product.
5. Tell users what to avoid when the image signals suggest irritation or instability.

## Current Matching Logic

The app maps the lowest-scoring analysis categories to product categories:

- Redness or irritation signal: calming ampoule, soothing toner, soothing cream
- Texture or roughness signal: barrier cream, hydration serum, light hydrating toner
- Tone or spot candidate signal: sunscreen first
- Shine signal: light hydration rather than heavy occlusive products
- Wrinkle candidate signal: hydration/barrier and sunscreen, not a strong anti-aging claim

## Safety Boundaries

The app should not:

- Claim that a product treats disease
- Recommend products for skin cancer, infection, severe acne, or dermatitis
- Recommend aggressive actives as a first step
- Hide uncertainty or product limitations

## Manual Review Needed Before Public Release

Before wider release, product entries should be reviewed against current official ingredient lists and regional availability.

The catalog currently lists 30 candidates across calming/barrier/hydration/brightening/sun/pad categories (`src/lib/productCatalog.js`). Entries were chosen from long-running, widely available Korean skincare products to minimize the risk of recommending discontinued items, but none of them have been verified against current official ingredient lists, pricing, or stock status. Treat every entry as a draft candidate until someone checks it against the brand's official listing.

Products marked `tier: 'A'` are cross-referenced against a 2025 Olive Young Awards-based candidate list (see Source below); `tier: 'B'` or untagged entries are steady-seller/brand-recognition picks without that specific cross-reference. The `tier` field is a provenance note, not an independent verification by this app.

### Scope: why some Olive Young categories are excluded

A broader 12-category Olive Young candidate list (마스크팩/클렌징/선케어/토너·미스트/세럼·앰플/크림·보습/패드/쿠션·베이스/립/아이메이크업/샴푸·헤어케어/바디케어, 30 products each) was reviewed on 2026-07-01. Only 선케어, 토너/미스트, 세럼/앰플, 크림/보습, and 패드 were pulled in, because those are the only categories that map to what this app actually scores (redness/tone/spots/texture/shine/wrinkle on facial skin). Cleansing, sheet masks, makeup (cushion/base, lip, eye), hair care, and body care were intentionally left out — there's no skin-signal basis in this app for recommending a mascara or a shampoo, and forcing a `fits` mapping onto them would be a fabricated justification, not a real one. Revisit this list if the app's scope changes (e.g., if it starts asking about hair/scalp or body skin separately).

### Source

- 올리브영 공식 2025 어워즈 페이지: https://www.oliveyoung.co.kr/store/amusement/award.do?awardedYear=2025
- Olive Young Awards 2025 정리 페이지: https://themonodist.com/olive-young-awards-2025/
