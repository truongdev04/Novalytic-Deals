# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc với repo này.

## Tổng quan

**NovalyticDeals** — website Coupon / Deals / Affiliate cho thị trường **Mỹ & Châu Âu**. Mục tiêu: SEO Google mạnh, CTR/CVR cao, load nhanh, responsive, sẵn sàng gắn backend thật.

**Tham khảo:**

- UX/layout: [fireskycoupons.com](https://fireskycoupons.com/) — chỉ tham khảo pattern, không copy.
- Wireframe doc (Google Doc) là mockup ảnh, xác nhận cấu trúc: Home → Store → Category → Deal → Event → Blog; Backend = Dashboard + Settings. Spec chi tiết trong file này là nguồn chính.

**Design direction:** hiện đại, chuyên nghiệp, clean, premium. Primary **green**, accent **orange/yellow**, nền sáng, bo góc, shadow nhẹ, animation tiết chế.

## Trạng thái & lệnh

Đã scaffold Next.js App Router với các route stub. Cập nhật lệnh khi `package.json` có thật — không bịa lệnh:

```
npm run dev         # dev server
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit  (thêm nếu chưa có)
```

## Tech stack

**Frontend:** Next.js App Router · TypeScript strict · Tailwind · shadcn/ui · lucide-react · Framer Motion (nhẹ) · React Hook Form + Zod · `next/image` · `next/font` (Inter + Poppins).
Server Components mặc định; Client Components chỉ khi cần tương tác.

**Backend (đích):** Prisma + PostgreSQL (Supabase/Neon) · Redis Upstash (cache + rate limit) · NextAuth (admin) · Resend (email) · Meilisearch/Algolia (search khi cần) · Route Handlers `app/api/*`.

## Design system

- Colors: token trong `tailwind.config.ts` (`brand.*`, `accent.*`, `surface.*`, `muted.*`) — không hardcode hex.
- Fonts: Inter (body), Poppins (heading), qua `next/font`. Contrast WCAG AA.
- Radius: `rounded-lg` card, `rounded-xl` hero, `rounded-full` pill. Shadow `sm` → `md` khi hover.
- Motion: 150–250ms `ease-out`. Tôn trọng `prefers-reduced-motion`.

## Site structure (Frontend)

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
- `/go/[couponId]` — server-side redirect log click rồi 302 sang affiliate URL (xem "Affiliate tracking").

## Components (`components/`, gom theo domain)

Layout: `Header`, `Footer`, `MobileNav`, `Breadcrumb`, `Container`, `SectionHeader`.
Coupon: `CouponCard`, `DealCard`, `CouponCodeModal`, `CopyCodeButton`, `ExpirationBadge`, `VerifiedBadge`, `DiscountBadge`.
Store: `StoreCard`, `StoreLogo`, `StoreRating`, `StoreHeader`, `StoreListAZ`.
Category/Blog: `CategoryCard`, `CategoryChip`, `BlogCard`, `TableOfContents`, `RelatedPosts`, `ShareButtons`.
Search: `SearchBox`, `SearchAutocomplete`, `FilterSidebar`, `SortDropdown`, `Pagination`, `ActiveFiltersBar`.
UI: `FAQAccordion`, `Newsletter`, `Button`, `Modal`, `Toast`, `Rating`, `Badge`, `Tag`, `EmptyState`, `LoadingSkeleton`, `BackToTop`.

**KHÔNG hardcode content trong page/component.** Mọi dữ liệu đi qua `lib/data/*` (repository). Hiện tại repo đọc từ `data/*.json`, sau này swap sang Prisma/API — UI không đổi.

## Backend architecture

### Layered data flow

```
UI (Server Component) → lib/data/* (repository, async) → mock JSON | Prisma | fetch(API)
```

Types trong `types/`. UI **không** import mock trực tiếp, **không** gọi fetch nội bộ tới `/api/*` từ Server Component (gọi repository trực diện).

### Domain model (đồng bộ với `prisma/schema.prisma` khi có)

- **Store** — id, slug, name, logoUrl, bannerUrl, website, description, rating, ratingCount, categoryIds[], region (`US|EU|GLOBAL`), affiliateNetwork, isFeatured, seo{title,description}, faq[], timestamps.
- **Coupon** — id, slug, storeId, title, description, type (`CODE|DEAL|CASHBACK|FREESHIP|BOGO`), code?, discountType (`PERCENT|AMOUNT|OTHER`), discountValue, currency, affiliateUrl, exclusive, verified, verifiedAt, terms, startsAt, expiresAt, usageCount, upvotes, downvotes, isFeatured, isTrending, timestamps.
- **Category** — id, slug, name, description, iconName, parentId?, isFeatured, seo.
- **BlogPost** — id, slug, title, excerpt, coverImage, authorId, tags[], categoryId, body (MDX), publishedAt, seo, isFeatured.
- **Event** — id, slug, name, description, startsAt, endsAt, bannerUrl, featuredStoreIds[], featuredCouponIds[].
- **Review** — id, storeId, userId?, rating (1–5), title, body, isApproved, createdAt.
- **ClickEvent** — id, couponId, storeId, userAgent, referer, country, sessionId, createdAt (đo CTR/CVR).
- **NewsletterSubscriber** — id, email, confirmedAt, unsubscribedAt, source, tags[].
- **User (admin)** — id, email, hashedPassword|oauthId, role (`ADMIN|EDITOR`).

### API surface (`app/api/*`, Zod validate, JSON typed)

- `GET  /api/coupons`, `/api/coupons/[slug]`; `POST /api/coupons/[id]/vote`, `/api/coupons/[id]/reveal` (log + trả code + affiliate URL).
- `GET  /api/stores`, `/api/stores/[slug]`; `POST /api/stores/[id]/reviews` (moderation queue).
- `GET  /api/categories`, `/api/categories/[slug]`.
- `GET  /api/blog`, `/api/blog/[slug]`; `GET /api/events`, `/api/events/[slug]`.
- `GET  /api/search`.
- `POST /api/newsletter/subscribe` (double opt-in Resend), `/api/contact`, `/api/submit-coupon`.
- `GET  /api/sitemap` (chunk theo section nếu > 50k URL).
- **Admin** `app/api/admin/*` — CRUD coupon/store/category/blog/event/review/user, bảo vệ bằng NextAuth middleware.

### Affiliate tracking `/go/[couponId]`

Không expose affiliate URL trong DOM. Server handler log `ClickEvent` + tăng `usageCount` rồi 302 sang affiliate. Modal "Show Code" đồng thời `POST /api/coupons/[id]/reveal` và mở `/go/[couponId]` tab mới.

### Caching

- Server Component fetch qua repo + `unstable_cache` / `next.revalidate` với tag: `coupons:list`, `coupon:<slug>`, `store:<slug>`.
- ISR trang hot: home, top store, top category (`revalidate: 300`).
- Admin update → `revalidateTag()`.
- Redis (Upstash) khi traffic tăng: cache popular-stores, trending-deals, home blocks (TTL 60–300s).

### Search

Phase 1: Postgres `ILIKE` + trigram trên `title/description/store.name`. Phase 2: Meilisearch/Algolia + worker sync — API không đổi, chỉ swap repo.

### Auth & bảo mật

- Public site không cần login.
- `/admin/*` + `/api/admin/*` bảo vệ bằng NextAuth (credentials + Google OAuth optional). Cookie `httpOnly, secure, sameSite=lax`. Roles `ADMIN|EDITOR`. Guard qua `middleware.ts`.
- Mọi `POST`: Zod, size limit, rate limit (Upstash Ratelimit — newsletter 5/min, vote 10/min, review 3/h, submit-coupon 3/day), honeypot + Cloudflare Turnstile.
- Headers qua `next.config.js`: CSP, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`.
- Prisma parameterized only. Không `dangerouslySetInnerHTML` untrusted; MDX blog `rehype-sanitize`.

### Backend Dashboard (`/admin`)

Theo mockup doc — 2 khối chính:

- **Dashboard**: KPI (traffic, click-out, CTR, CVR, top stores, top coupons, revenue estimate), biểu đồ theo ngày/tuần/tháng, feed hoạt động, moderation inbox (reviews + submitted coupons chờ duyệt).
- **Settings**: profile admin, quản lý user + role, site meta (title/description/logo/favicon/OG), affiliate network defaults, integrations (Resend, Turnstile, Analytics), sitemap/robots toggles, redirect rules, cache purge.
- CRUD modules: Stores, Coupons, Categories, Deals, Events, Blog, Reviews, Newsletter subscribers.

### Env vars (`.env.example` commit, `.env` bỏ qua)

```
DATABASE_URL= REDIS_URL=
NEXTAUTH_URL= NEXTAUTH_SECRET=
RESEND_API_KEY=
TURNSTILE_SITE_KEY= TURNSTILE_SECRET_KEY=
AFFILIATE_DEFAULT_NETWORK=
NEXT_PUBLIC_SITE_URL= NEXT_PUBLIC_GA_ID= NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

### Directory layout

```
app/  (marketing)/ (shop)/ (legal)/ admin/ api/ go/[couponId]/
components/   (theo domain)
lib/  data/  db/  cache/  seo/  affiliate/  analytics/  validators/  utils/
data/         # mock JSON (bỏ khi có DB)
types/  prisma/  public/  tests/
```

## SEO checklist

- Semantic HTML, đúng H1–H6 (1 H1/trang).
- `generateMetadata` mỗi route: title, description, canonical, OG, Twitter Card (ảnh riêng store/coupon).
- `robots.txt` + dynamic `sitemap.xml` (split khi lớn).
- JSON-LD trong `lib/seo/`: `Organization` (root), `WebSite + SearchAction` (home), `BreadcrumbList` mọi trang, `Product + Offer` cho coupon, `FAQPage`, `Article` blog, `AggregateRating` store.
- Slug lowercase kebab, keyword-first (`/store/best-buy`, `/coupon/best-buy-10-off-tv`).
- Internal link chặt: coupon↔store↔category↔blog. `alt` mô tả. 404 hữu ích. `hreflang` khi có US/EU tách bản.

## Performance

- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Server Components mặc định; audit `@next/bundle-analyzer`. `dynamic()` cho modal/share/MDX.
- `next/image` (width/height hoặc `fill+sizes`), `next/font` subset.
- ISR + `revalidateTag` như phần Caching. Brotli edge.

## UX / CVR

Header + search sticky · CTA accent nổi bật · reveal code modal + auto-copy + toast + tab affiliate · verified/exclusive badge · "Ends in Xd" · thumbs up/down · related coupons/stores · skeleton + empty state · newsletter exit-intent (dismissable, tôn trọng reduced-motion) · Back-to-top · dark mode optional.

## Accessibility (WCAG AA)

Keyboard đầy đủ · focus ring rõ · ARIA cho icon-button/accordion/toast · contrast đạt AA · landmark (`header/nav/main/aside/footer`) · modal focus-trap + Esc · form có label + `aria-describedby` cho lỗi · không dùng color-only.

## Code conventions

- TS strict, không implicit `any`, không `@ts-ignore` thiếu lý do.
- Page mỏng: route + fetch qua repo + compose component.
- Không hardcode content — luôn qua `lib/data/*`.
- Named export, một component / file, filename khớp export.
- Zod schema trong `lib/validators/` dùng chung cho API + form.
- Commit theo Conventional Commits.

## Khi phân vân

- Ưu tiên pattern Next.js chuẩn hơn là "thông minh".
- Đổi UI kéo theo đổi shape data → sửa `types/` + repo TRƯỚC, UI sau.
- Sắp hardcode content → dừng, chuyển vào mock/repo.
- Trang mới → luôn kèm `generateMetadata` + JSON-LD phù hợp.
