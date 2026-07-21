# Site structure (Frontend)

Route dưới `app/`:

- `/` **Home** — Header, Hero + Search sticky, Popular Stores (grid logo), Featured Coupons, Trending Deals, Categories, Recommended Stores, Latest Coupons, Newsletter, Featured Blog, Footer.
- `/stores`, `/store/[slug]` — index A–Z; trang store: banner, logo, rating, mô tả, coupon active/expired, FAQ, related stores, reviews.
- `/coupon/[slug]` — thông tin, nút **Show Code / Get Deal**, modal reveal + auto-copy, terms, expiration, verified badge, thumbs up/down, share, related.
- `/categories`, `/categories/[slug]` — grid + search + pagination; trang category: top stores + coupons + FAQ.
- `/deals` — tất cả deals, filter/sort.
- `/events`, `/events/[slug]` — landing seasonal (Black Friday, Cyber Monday, Prime Day, Christmas…) với timer + coupon curated.
- `/search?q=` — kết quả + filter (store/category/type/discount) + sort (relevance/expiring/newest/discount).
- `/blog`, `/blog/[slug]` — list + featured + sidebar; detail có TOC, author, related, share, FAQ.
- `/about`, `/contact`, `/privacy`, `/terms`, `/submit` (user gửi coupon).
- `/go/[couponId]` — server-side redirect log click rồi 302 sang affiliate URL (xem [backend-architecture.md](backend-architecture.md) mục "Affiliate tracking").
