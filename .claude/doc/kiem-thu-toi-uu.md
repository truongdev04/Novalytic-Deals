# Production Hardening & Performance Optimization

## 1. Mục tiêu

Đưa NovalyticDeals (đã deploy tại novalyticdeals.com) sẵn sàng phục vụ người dùng thật: fix lỗi production đang diễn ra, hoàn thiện SEO/resilience/test/CI, audit nội dung, và tối ưu tốc độ tải trang.

## 2. Những phần đã hoàn thành

### P0 — Fix crash production (khẩn cấp)
- Nguyên nhân: `isomorphic-dompurify` (→ `jsdom` → `html-encoding-sniffer` → `@exodus/bytes`, một ESM package) bị Turbopack cố bundle, ném `ERR_REQUIRE_ESM` mỗi khi [components/ui/RichHtml.tsx](../../components/ui/RichHtml.tsx) render. Ảnh hưởng gần như toàn bộ `/store/[slug]`, `/blog/[slug]`, `/[slug]` (legal pages) từ 2026-07-18 đến 2026-07-24 (4854+ lỗi, 70+ user).
- Fix: thêm `serverExternalPackages: ["isomorphic-dompurify", "jsdom"]` vào [next.config.ts](../../next.config.ts).
- Verify: local build+start các route bị ảnh hưởng → 200 OK, không còn lỗi trong log. Đã push riêng ngay khi confirm.

### P1 — Verify Redis/Turnstile
- Test rate limit thật trên production: gọi 7 request liên tiếp tới `/api/newsletter/subscribe` → request thứ 6 nhận `429` → xác nhận Upstash Redis hoạt động thật.
- Turnstile: xác nhận qua code path (secret key lấy từ DB qua `getEffectiveTurnstileConfig()`, request không token bị reject `400`) — **chưa verify bằng mắt** widget có hiển thị trên `/contact` không (cần trình duyệt thật).

### P2 — Public review submission
- Thêm [lib/validators/review.ts](../../lib/validators/review.ts) (Zod: rating 1-5 int, title, body, authorName, turnstileToken, honeypot).
- Thêm `POST /api/stores/[slug]/reviews` ([app/api/stores/[slug]/reviews/route.ts](../../app/api/stores/%5Bslug%5D/reviews/route.ts)) — dùng lại `createReview()`, `reviewRateLimit` (3/h), honeypot + Turnstile check. Route nằm ở `[slug]` (không phải `[id]` như dự tính ban đầu) để tránh Next.js conflict với `app/api/stores/[slug]/route.ts` sẵn có.
- Thêm [components/store/ReviewForm.tsx](../../components/store/ReviewForm.tsx) (client, react-hook-form + zodResolver) và [components/store/ReviewList.tsx](../../components/store/ReviewList.tsx), wire vào [app/store/[slug]/page.tsx](../../app/store/%5Bslug%5D/page.tsx).
- Verify end-to-end qua curl: rate limit 3/h kích hoạt đúng, Turnstile chặn request thiếu token, honeypot silent-accept, 404 khi store không tồn tại.

### P3 — Structured data còn thiếu
- Gắn `breadcrumbJsonLd` (đã viết sẵn ở `lib/seo/jsonld.ts`, chưa dùng) vào 8 route: store/[slug], coupon/[slug], categories (index/[slug]/[slug]/stores), events (index/[slug]/[slug]/stores).
- `articleJsonLd` hoá ra đã được wire sẵn ở `app/blog/[slug]/page.tsx` — không cần sửa.
- Thêm `export const viewport` vào [app/layout.tsx](../../app/layout.tsx) (thiếu hoàn toàn trước đó).
- Verify: curl các route → `"@type":"BreadcrumbList"` xuất hiện đúng; `<meta name="viewport">` render đúng.

### P4 — Loading/error/not-found boundaries
- Thêm `loading.tsx` (skeleton, dùng `LoadingSkeleton`/`CardSkeleton` có sẵn) cho: `store/[slug]`, `coupon/[slug]`, `blog/[slug]`, `deals`, `categories/[slug]`.
- Thêm `app/not-found.tsx` + `app/error.tsx` (root level).
- **Bug tìm thấy khi viết e2e test**: `/store/[slug]` có 2 thẻ `<h1>` (một ở [components/store/StoreHeader.tsx](../../components/store/StoreHeader.tsx), một ở page) — vi phạm rule "1 H1/trang". Đã fix: đổi h1 trong StoreHeader thành `<p>`.

### P5 — Test tự động + CI
- Cài Vitest ([vitest.config.ts](../../vitest.config.ts)) — 34 unit test cho `lib/validators/*` (review, submitCoupon, newsletter, contact, vote) và `lib/server/*` (honeypot, rateLimit fallback, affiliate redirect builder).
- Cài Playwright ([playwright.config.ts](../../playwright.config.ts)) — 10 e2e test trong `e2e/`: page rendering, search flow, reveal→/go redirect chain (API-level), form validation (newsletter/submit-coupon/review — **chỉ validate, không submit thật** vì chưa có DB test riêng, chỉ có 1 DATABASE_URL trỏ production).
- Thêm [.github/workflows/ci.yml](../../.github/workflows/ci.yml): job `checks` (lint/typecheck/vitest, luôn chạy) + job `build-and-e2e` (cần secrets `DATABASE_URL`/`DIRECT_URL`/`NEXTAUTH_SECRET` + repo variable `CI_DB_CONFIGURED=true`, hiện **chưa kích hoạt**).
- Scripts mới trong `package.json`: `test`, `test:watch`, `test:e2e`.

### P6 — Audit nội dung production
- 24 store, 98 coupon, 25 category: logo load OK (200), affiliate URL thật có tracking params, không có coupon/category test/nháp.
- **Phát hiện: bài blog "abcdef"** (id `15b67d1c-d696-429a-a7b7-7a7e6161d227`) là content test thật, `isFeatured:true`, publish 2026-07-06, vẫn public — **user tự xử lý qua `/admin/blog`, chưa xác nhận đã xoá**.
- **Phát hiện nghiêm trọng: `NEXT_PUBLIC_SITE_URL` trên Vercel Production bị set `http://localhost:3000`** thay vì domain thật → hỏng toàn bộ canonical URL, OG:url, và cả 178 URL trong `/sitemap.xml`. **Chưa fix** — cần user tự sửa trong Vercel dashboard (không có tool quyền ghi env var) rồi redeploy.

### P7 — Docs
- Cập nhật [CLAUDE.md](../../CLAUDE.md) mục "Trạng thái & lệnh" (không còn ghi "route stub", thêm lệnh `test`/`test:e2e`).

### Performance optimization
- Baseline đo trước khi sửa: trang chủ tải ~1.18MB JS uncompressed (16 chunks qua `.next/static`).
- Code-split `next/dynamic`:
  - [components/coupon/CouponCodeModal.tsx](../../components/coupon/CouponCodeModal.tsx): `CodeRevealDialog` → `ssr:false`.
  - [components/admin/RichTextEditor.tsx](../../components/admin/RichTextEditor.tsx): `ImageInsertModal`, `LinkModal` → `ssr:false`.
  - [components/admin/StoreForm.tsx](../../components/admin/StoreForm.tsx), [BlogForm.tsx](../../components/admin/BlogForm.tsx), [FooterItemForm.tsx](../../components/admin/FooterItemForm.tsx): `RichTextEditor` (toàn bộ Tiptap) → `ssr:false`.
  - [app/admin/page.tsx](../../app/admin/page.tsx): `TopStoresBarChart` (recharts) qua wrapper mới [components/admin/TopStoresBarChartLazy.tsx](../../components/admin/TopStoresBarChartLazy.tsx) (`ssr:false` không được phép gọi trực tiếp trong Server Component).
  - [app/page.tsx](../../app/page.tsx): `StoreCarousel` (embla-carousel) → giữ `ssr:true` (theo quyết định user, ưu tiên SEO/internal-link).
- **Verify bằng số liệu thật** (không chỉ đoán):
  - Admin: xác nhận qua `page_client-reference-manifest.js` — chunk recharts/Tiptap (~350-500KB) không còn eager-required cho `/admin`.
  - Homepage: `StoreCarousel` với `ssr:true` **không giảm** tổng byte tải (vẫn `async:false`, tổng JS gần như không đổi 1205KB→1211KB) — phát hiện và báo lại cho user, giữ nguyên theo quyết định.
- Thêm `@vercel/speed-insights` vào [app/layout.tsx](../../app/layout.tsx) để có field CWV data thật (trước đây = 0, Vercel Web Analytics cũng chưa bật cho project).
- **Bug tìm thấy khi smoke test**: CSP trong `next.config.ts` chặn script `va.vercel-scripts.com` của Speed Insights → đã mở thêm `script-src: va.vercel-scripts.com` và `connect-src: vitals.vercel-insights.com`.
- Cài rồi **gỡ lại** `@next/bundle-analyzer` — package tự nhận diện Turbopack và no-op hoàn toàn (xác nhận qua source code của package). Thay bằng `next experimental-analyze -o` (native Turbopack, đã test chạy thành công) qua script `npm run analyze`.
- Smoke test thủ công bằng Playwright script: "Show Code" mở modal đúng (dialog visible), admin chart + rich text editor vẫn render đúng sau code-split.

## 3. Trạng thái hiện tại

- Code chạy ổn định local (typecheck/lint sạch, 34 Vitest + 10 Playwright pass) và đã **push lên `origin/main`** — Vercel tự deploy.
- **Lỗi/việc chưa fix, cần biết:**
  1. **`NEXT_PUBLIC_SITE_URL` trên Vercel Production vẫn sai** (`http://localhost:3000`) — canonical/OG/sitemap toàn site vẫn hỏng cho đến khi user tự sửa trong Vercel dashboard + redeploy.
  2. Bài blog "abcdef" — chưa xác nhận đã bị xoá.
  3. Turnstile widget — chưa verify bằng mắt trên trình duyệt thật.
  4. `npm audit`: lỗ hổng **critical** trong Auth.js (next-auth) + high trong Next.js/sharp — pre-existing, chưa xử lý (cần đánh giá breaking-change risk riêng).
  5. CI job `build-and-e2e` chưa active (thiếu secrets `DATABASE_URL`/`DIRECT_URL`/`NEXTAUTH_SECRET` + variable `CI_DB_CONFIGURED` trên GitHub repo).
  6. Chưa có số đo Lighthouse/PageSpeed Insights thật trên production (chỉ mới thêm công cụ đo — Speed Insights — chưa có đủ dữ liệu field vì mới deploy).

## 4. Bước tiếp theo

1. Sửa `NEXT_PUBLIC_SITE_URL` trên Vercel (Production env) → `https://novalyticdeals.com`, redeploy — **ưu tiên cao nhất, ảnh hưởng SEO toàn site**.
2. Xác nhận đã xoá bài blog "abcdef" qua `/admin/blog`.
3. Mở `/contact` bằng trình duyệt thật, xác nhận Turnstile widget hiển thị.
4. Thêm GitHub repo secrets (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`) + variable `CI_DB_CONFIGURED=true` để kích hoạt job `build-and-e2e` trong CI.
5. Sau vài ngày, xem Vercel Speed Insights dashboard lấy số LCP/INP/CLS thật, đối chiếu budget trong `.claude/rules/performance.md`.
6. Đánh giá riêng việc nâng cấp next-auth/Next.js/sharp để vá lỗ hổng bảo mật critical/high (rủi ro breaking change, cần plan riêng).
