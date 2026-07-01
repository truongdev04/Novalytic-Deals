---
name: add-store
description: Add a new store with its coupons to the mock data layer, following the shape expected by StoreCard/CouponCard components.
---

1. Add the store entry to `data/` (mock stores dataset) with slug,
   name, logo, rating, description.
2. Add its coupons to the mock coupons dataset, referencing the store
   slug.
3. Do not hard-code the new store/coupons directly in any page or
   component — CLAUDE.md requires all content to come from the data
   layer.
4. Verify `/store/[slug]` renders the new store correctly.
