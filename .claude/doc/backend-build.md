# Backend Build Session — 2026-07-02

## 1. Mục tiêu

Build backend thật (Prisma + PostgreSQL + NextAuth + API routes + admin dashboard) cho NovalyticDeals theo spec `CLAUDE.md`, thay thế toàn bộ mock JSON bằng DB thật mà không đổi signature `lib/data/*`.

## 2. Những phần đã hoàn thành

### Hạ tầng & DB
- Cài `prisma`/`@prisma/client` pin **6.19.3** (Prisma 7 mới ra đổi hẳn cách config datasource + cần driver adapter → downgrade để giữ pattern `url`/`directUrl` truyền thống), `next-auth@5.0.0-beta.31`, `@upstash/redis`, `@upstash/ratelimit`, `resend`, `bcryptjs`.
- `prisma/schema.prisma` — 13 models: Store, Category (self-relation parentId), Coupon, BlogPost + BlogAuthor, Event, Review, ClickEvent, NewsletterSubscriber, SubmittedCoupon, SiteSetting, User + join tables StoreCategory/EventStore/EventCoupon.
- Migrate thật lên **Supabase** (`prisma/migrations/20260702043603_init`). `DATABASE_URL` dùng **pooled connection port 6543 + `pgbouncer=true&connection_limit=10`** (bắt buộc — build Next.js chạy 7 worker song song, direct port 5432 hoặc `connection_limit=1` gây "too many connections"/timeout). `DIRECT_URL` port 5432 dùng riêng cho `prisma migrate`.
- `prisma/seed.ts` đọc `data/*.json` → insert DB thật (giữ nguyên JSON làm seed fixture, không xoá). Seed thêm 1 admin user từ `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`.
- `lib/server/db.ts` — Prisma client singleton, export cả `Prisma` namespace.
- `lib/server/cache/purgeTag.ts` — wrapper cho `revalidateTag` (Next.js 16 đổi signature, cần thêm profile arg `{ expire: 0 }`).
- Swap toàn bộ `lib/data/*.ts` (coupons/stores/categories/blog/events) sang đọc Prisma, **giữ nguyên tên hàm/tham số/return type**. Thêm mới: `reviews.ts`, `clicks.ts`, `newsletter.ts`, `submittedCoupons.ts`, `settings.ts`, `admin/analytics.ts`.

### API routes (`app/api/*`)
- Public GET: `/api/coupons(/[slug])`, `/api/stores(/[slug])`, `/api/categories(/[slug])`, `/api/blog(/[slug])`, `/api/events(/[slug])`, `/api/search` (ILIKE qua Prisma `contains`, chưa có trigram ranking).
- Affiliate: `app/go/[couponId]/route.ts` (log ClickEvent + tăng usageCount + 302 redirect, set cookie session, không bao giờ lộ affiliateUrl trong DOM), `/api/coupons/[slug]/reveal` + `/api/coupons/[slug]/vote` (param tên `slug` nhưng nhận giá trị coupon id — do Next.js bắt buộc các dynamic route cùng cấp phải cùng tên segment).
- Forms: `/api/newsletter/subscribe` (+`confirm`,`unsubscribe`, double opt-in ký bằng HMAC qua `lib/server/security/signedToken.ts`), `/api/contact`, `/api/submit-coupon` — đều có Zod + rate limit (Upstash, graceful no-op khi chưa cấu hình) + Turnstile (`lib/server/security/turnstile.ts`, skip verify khi chưa có secret key) + honeypot.
- Admin: `/api/admin/{stores,coupons,categories,blog,events,reviews,newsletter,submitted-coupons,settings}` — CRUD đầy đủ cho categories & stores, toggle+delete cho coupons/blog, delete cho events, moderation (approve/reject/unsubscribe) cho reviews/newsletter/submitted-coupons.

### Auth & Admin UI
- `auth.ts` — NextAuth v5, Credentials provider, JWT session, role (`ADMIN`/`EDITOR`) trong token/session (type augmentation ở `types/next-auth.d.ts`).
- `proxy.ts` (đổi tên từ `middleware.ts` theo convention Next.js 16) — bảo vệ `/admin/*` + `/api/admin/*`.
- `app/admin/login`, `app/admin/layout.tsx` (sidebar `AdminSidebar` + `AdminTopbar` ở **trên đầu**, không phải footer).
- `components/layout/SiteChrome.tsx` — tách Header/Footer public khỏi `/admin/*` (bug đã fix: layout gốc từng bọc Header/Footer public quanh cả trang admin). Pattern: Header/Footer là Server Component, truyền vào Client Component `SiteChrome` qua props (không import trực tiếp trong "use client").
- Dashboard `/admin` — KPI **chỉ từ ClickEvent thật** (click-out 30 ngày, top store/coupon, biểu đồ 14 ngày dạng CSS bar) — **không** có revenue/CVR giả vì domain model chưa có dữ liệu conversion.
- Stores: full CRUD form (`StoreForm.tsx`, multi-select category), bảng có search + thumbnail logo + tên category + nút Edit icon (theo ảnh tham khảo user cung cấp).
- Categories: full CRUD form. Coupons/Blog: bảng search + thumbnail + toggle featured/verified + delete (chưa có form edit đầy đủ). Events: list + delete only.
- Settings: site meta (title/description/logo/favicon/OG) lưu qua model `SiteSetting` key-value.

### Bảo mật & polish
- `next.config.ts` — security headers (CSP, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, X-Content-Type-Options).
- `app/robots.ts` — disallow `/admin`, `/api`, `/go`.
- `.env` (gitignored, đã điền connection string Supabase thật + admin seed credentials) / `.env.example` (đầy đủ, không có secret thật).

## 3. Trạng thái hiện tại

- Dev server chạy ổn định tại `http://localhost:3000`. `npm run typecheck`, `npm run lint` (chỉ 1 warning không đáng kể ở `lib/server/affiliate/redirect.ts`), `npm run build` đều sạch — 126 routes generate thành công.
- DB thật trên Supabase, đã seed đủ data gốc (16 stores, 34 coupons, 8 categories, 8 blog, 10 events).
- Đã test end-to-end: login admin qua NextAuth (email `admin@novalyticdeals.com`, password lưu trong `.env` — **cần đổi**), tạo/xoá store qua form thật, middleware chặn đúng `/admin` và `/api/admin/*` khi chưa đăng nhập.
- Chưa có lỗi tồn đọng nào được biết.

## 4. Bước tiếp theo

- Xây form edit đầy đủ cho **Coupon**, **BlogPost**, **Event** (hiện chỉ toggle nhanh + delete, chưa sửa được full field như Store/Category).
- Chưa có UI quản lý `featuredStoreIds`/`featuredCouponIds` cho Event trong admin (chỉ set được lúc seed).
- Điền key thật: `UPSTASH_REDIS_REST_URL/TOKEN`, `RESEND_API_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`, `CONTACT_INBOX_EMAIL` — hiện tất cả đang chạy chế độ graceful-degrade (bỏ qua rate-limit/verify/gửi mail thật khi thiếu key).
- Đổi mật khẩu admin seed, cân nhắc thêm rate-limit riêng cho `/api/auth/*`.
- Affiliate redirect (`lib/server/affiliate/redirect.ts`) hiện là passthrough đơn giản — nếu cần subid/click-id theo network cụ thể (Impact/CJ/Awin...) phải bổ sung templating.
- Search (`/api/search`) mới ở mức ILIKE cơ bản, chưa có trigram ranking hay Meilisearch/Algolia (đúng theo scope Phase 1 đã chốt).
- Chạy security review + xoá route/API test trước khi deploy production; chưa cấu hình hosting (Vercel) hay CI.
