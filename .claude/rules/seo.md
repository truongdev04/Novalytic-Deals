# SEO checklist

- Semantic HTML, đúng H1–H6 (1 H1/trang).
- `generateMetadata` mỗi route: title, description, canonical, OG, Twitter Card (ảnh riêng store/coupon).
- `robots.txt` + dynamic `sitemap.xml` (split khi lớn).
- JSON-LD trong `lib/seo/`: `Organization` (root), `WebSite + SearchAction` (home), `BreadcrumbList` mọi trang, `Product + Offer` cho coupon, `FAQPage`, `Article` blog, `AggregateRating` store.
- Slug lowercase kebab, keyword-first (`/store/best-buy`, `/coupon/best-buy-10-off-tv`).
- Internal link chặt: coupon↔store↔category↔blog. `alt` mô tả. 404 hữu ích. `hreflang` khi có US/EU tách bản.
