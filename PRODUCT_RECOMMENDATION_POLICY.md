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

The catalog currently lists 15 candidates across calming/barrier/hydration/brightening/sun categories (`src/lib/productCatalog.js`). Entries were chosen from long-running, widely available Korean skincare products to minimize the risk of recommending discontinued items, but none of them have been verified against current official ingredient lists, pricing, or stock status. Treat every entry as a draft candidate until someone checks it against the brand's official listing.
