# Backend architecture

## Domain model (đồng bộ với `prisma/schema.prisma` khi có)

- **Store** — id, slug, name, logoUrl, bannerUrl, website, description, rating, ratingCount, categoryIds[], region (`US|EU|GLOBAL`), affiliateNetwork, isFeatured, seo{title,description}, faq[], timestamps.
- **Coupon** — id, slug, storeId, title, description, type (`CODE|DEAL|CASHBACK|FREESHIP|BOGO`), code?, discountType (`PERCENT|AMOUNT|OTHER`), discountValue, currency, affiliateUrl, exclusive, verified, verifiedAt, terms, startsAt, expiresAt, usageCount, upvotes, downvotes, isFeatured, isTrending, timestamps.
- **Category** — id, slug, name, description, iconName, parentId?, isFeatured, seo.
- **BlogPost** — id, slug, title, excerpt, coverImage, authorId, tags[], categoryId, body (MDX), publishedAt, seo, isFeatured.
- **Event** — id, slug, name, description, startsAt, endsAt, bannerUrl, featuredStoreIds[], featuredCouponIds[].
- **Review** — id, storeId, userId?, rating (1–5), title, body, isApproved, createdAt.
- **ClickEvent** — id, couponId, storeId, userAgent, referer, country, sessionId, createdAt (đo CTR/CVR).
- **NewsletterSubscriber** — id, email, confirmedAt, unsubscribedAt, source, tags[].
- **User (admin)** — id, email, hashedPassword|oauthId, role (`ADMIN|EDITOR`).

## API surface (`app/api/*`, Zod validate, JSON typed)

- `GET  /api/coupons`, `/api/coupons/[slug]`; `POST /api/coupons/[id]/vote`, `/api/coupons/[id]/reveal` (log + trả code + affiliate URL).
- `GET  /api/stores`, `/api/stores/[slug]`; `POST /api/stores/[id]/reviews` (moderation queue).
- `GET  /api/categories`, `/api/categories/[slug]`.
- `GET  /api/blog`, `/api/blog/[slug]`; `GET /api/events`, `/api/events/[slug]`.
- `GET  /api/search`.
- `POST /api/newsletter/subscribe` (double opt-in Resend), `/api/contact`, `/api/submit-coupon`.
- `GET  /api/sitemap` (chunk theo section nếu > 50k URL).
- **Admin** `app/api/admin/*` — CRUD coupon/store/category/blog/event/review/user, bảo vệ bằng NextAuth middleware.

## Affiliate tracking `/go/[couponId]`

Không expose affiliate URL trong DOM. Server handler log `ClickEvent` + tăng `usageCount` rồi 302 sang affiliate. Modal "Show Code" đồng thời `POST /api/coupons/[id]/reveal` và mở `/go/[couponId]` tab mới.

## Caching

- Server Component fetch qua repo + `unstable_cache` / `next.revalidate` với tag: `coupons:list`, `coupon:<slug>`, `store:<slug>`.
- ISR trang hot: home, top store, top category (`revalidate: 300`).
- Admin update → `revalidateTag()`.
- Redis (Upstash) khi traffic tăng: cache popular-stores, trending-deals, home blocks (TTL 60–300s).

## Search

Phase 1: Postgres `ILIKE` + trigram trên `title/description/store.name`. Phase 2: Meilisearch/Algolia + worker sync — API không đổi, chỉ swap repo.

## Auth & bảo mật

- Public site không cần login.
- `/admin/*` + `/api/admin/*` bảo vệ bằng NextAuth (credentials + Google OAuth optional). Cookie `httpOnly, secure, sameSite=lax`. Roles `ADMIN|EDITOR`. Guard qua `middleware.ts`.
- Mọi `POST`: Zod, size limit, rate limit (Upstash Ratelimit — newsletter 5/min, vote 10/min, review 3/h, submit-coupon 3/day), honeypot + Cloudflare Turnstile.
- Headers qua `next.config.js`: CSP, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`.
- Prisma parameterized only. Không `dangerouslySetInnerHTML` untrusted; MDX blog `rehype-sanitize`.

## Backend Dashboard (`/admin`)

Theo mockup doc — 2 khối chính:

- **Dashboard**: KPI (traffic, click-out, CTR, CVR, top stores, top coupons, revenue estimate), biểu đồ theo ngày/tuần/tháng, feed hoạt động, moderation inbox (reviews + submitted coupons chờ duyệt).
- **Settings**: profile admin, quản lý user + role, site meta (title/description/logo/favicon/OG), affiliate network defaults, integrations (Resend, Turnstile, Analytics), sitemap/robots toggles, redirect rules, cache purge.
- CRUD modules: Stores, Coupons, Categories, Deals, Events, Blog, Reviews, Newsletter subscribers.

## Directory layout

```
app/  (marketing)/ (shop)/ (legal)/ admin/ api/ go/[couponId]/
components/   (theo domain)
lib/  data/  db/  cache/  seo/  affiliate/  analytics/  validators/  utils/
data/         # mock JSON (bỏ khi có DB)
types/  prisma/  public/  tests/
```
