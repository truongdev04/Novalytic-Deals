# DB Egress Optimization — Đẩy filter/pagination xuống Prisma/Postgres

## 1. Mục tiêu

Giảm băng thông (egress) Supabase free tier bằng cách loại bỏ pattern "fetch
toàn bộ bảng rồi lọc bằng JavaScript" ở các trang/API public, thay bằng
Prisma `where`/`take`/`orderBy`/`groupBy` để Postgres chỉ trả về đúng dữ liệu
cần thiết.

## 2. Những phần đã hoàn thành

**Migration (`prisma/schema.prisma`, áp dụng qua `prisma db push`, không
dùng `migrate dev` vì phát hiện drift lịch sử migration có sẵn):**
- `Store`: thêm `@@index([categoryIds], type: Gin)`
- `Category`: thêm `@@index([isFeatured])`
- `BlogPost`: thêm `@@index([isFeatured])` và `@@index([tags], type: Gin)`

**`lib/data/stores.ts`:**
- `getStores`, `getFeaturedStores`, `getStoreById`, `getStoresByIds`,
  `getStoresByCategory`, `getRelatedStores`, `searchStores` — đổi từ
  fetch-all + JS filter/find/slice sang Prisma `where`/`take` trực tiếp.
- `getStoresByIds` giữ đúng thứ tự input `ids` (re-map qua Map).
- `groupStoresByLetter` và nhu cầu full active-store list cho index A-Z —
  giữ nguyên (không thể phân trang một danh mục A-Z).

**`lib/data/coupons.ts` (thay đổi nhiều nhất):**
- Thêm `ensureCouponsExpired()` — tách `expireOverdueCoupons()` khỏi
  `getAllCouponsCached()` thành một `unstable_cache` riêng (keyParts
  `coupons:expiry-tick`, tag `coupons:list`), gọi ở đầu mọi getter public để
  giữ đúng cơ chế lazy-expiry (tự flip `isActive/isTrending/isFeatured=false`
  cho coupon hết hạn) như code gốc.
- `getCoupons`, `getCouponsByStore`, `getFeaturedCoupons`,
  `getExclusiveCoupons`, `getTrendingCoupons` — đẩy `isActive`/`isFeatured`/
  `verified`/`exclusive`/`isTrending`/`storeId` + điều kiện hết hạn
  (`OR:[{expiresAt:null},{expiresAt:{gte:now}}]`, dùng `gte` không phải `gt`
  theo đúng semantics của `isExpired()` trong `lib/utils.ts`) xuống `where`.
- `filterCoupons` viết lại hoàn toàn qua 2 helper `buildCouponWhere`/
  `buildCouponOrderBy` — hỗ trợ `storeSlug`, `categoryId` (qua relation filter
  `store.categoryIds`), `type`, `query`, `sort` (4 kiểu, luôn kèm tiebreaker
  `createdAt desc`, `expiring` dùng `nulls:'last'`) hoàn toàn ở Prisma.
- Thêm `filterCouponsPaginated(filters, page, pageSize)` → `{items, total}`
  qua `$transaction([findMany, count])` — dùng riêng cho `/deals`.
- Thêm `getVerifiedCouponCountByStoreIds(storeIds)` (Prisma `groupBy`) và
  `getActiveCouponCountByCategory()` (raw SQL join Coupon×Store, unnest
  `categoryIds`) — thay cho việc kéo hết coupon để đếm bằng JS.
- `refreshTrendingCoupons` dùng `getTrendingCandidateCoupons()` (query hẹp
  hơn, không gọi lại `ensureCouponsExpired()` để tránh reentrancy) thay vì
  `getCoupons()` đầy đủ.

**`lib/data/categories.ts`:** `getFeaturedCategories` đẩy `isFeatured` xuống
`where` (cần index mới); `getCategoryById` dùng `findUnique`.

**`lib/data/deals.ts`:** `getDeals`, `getFeaturedDeals` áp dụng pattern giống
stores/coupons.

**`lib/data/blog.ts`:** `getBlogPosts` đẩy `isActive`; `getFeaturedBlogPosts`
đẩy `isFeatured`; `getRelatedBlogPosts` đẩy `tags:{hasSome}`. Thêm
`getBlogPostCards()` — biến thể `select`-narrowed bỏ cột `body` (nặng, `@db.Text`)
cho các card grid, trả về đúng shape `BlogPost` (`body: ""`) nên không cần đổi
type ở component `BlogCard`.

**Trang/API đã nối lại:**
- `app/deals/page.tsx` — dùng `filterCouponsPaginated` thay `filterCoupons` +
  `.slice()` JS; giữ `getStores()` full list vì `FilterSidebar` cần render
  option cho mọi store.
- `app/categories/[slug]/page.tsx`, `app/categories/page.tsx`,
  `app/stores/page.tsx`, `app/stores/[letter]/page.tsx` — thay vòng lặp đếm
  coupon bằng JS bằng `getVerifiedCouponCountByStoreIds`/
  `getActiveCouponCountByCategory`.
- `app/blog/page.tsx` — dùng `getBlogPostCards()`, giữ nguyên `allTags`
  sidebar (cần full tag universe, không chỉ theo tag đang lọc).
- `app/page.tsx` (home) — thay `getStores()` full list bằng
  `getStoresByIds()` chỉ với storeId thực sự xuất hiện trong deals/trending/
  exclusive cards.
- `app/api/search/route.ts` — cap `searchStores(q,{take:10})` và
  `filterCoupons({query:q, limit:8})` vì đây là endpoint gợi ý nhanh
  (SearchAutocomplete chỉ đọc `data.stores`).

**Không đụng ở đợt 1 (public):** `groupStoresByLetter`, `app/sitemap.ts`, các
job nền `lib/content/*` cần full tập dữ liệu để rank/rollover.

**Đợt 2 — Admin tables (Coupons, Deals, Blog, Reviews) chuyển sang server-side
pagination/filter:**
- `lib/utils.ts` — sửa `buildQueryUrl`: trước đây luôn `params.delete("page")`
  ở cuối bất kể `updates` có set `page` hay không, khiến nút phân trang
  `/deals` không hoạt động thật (mọi link đều mất `?page=`, luôn về trang 1).
  Giờ chỉ xoá `page` khi `updates` không tự set nó — vừa fix `/deals`, vừa cho
  phép tái dùng hàm này để điều hướng phân trang admin (`page` được set →
  giữ nguyên; đổi filter/search → tự reset về trang 1).
- Thêm `lib/hooks/useDebouncedValue.ts` (debounce ô search, ~350ms) và
  `lib/constants/admin.ts` (`PAGE_SIZE_OPTIONS`, tách riêng khỏi
  `AdminPagination.tsx` vì file đó có `"use client"` — import trực tiếp một
  hằng số từ file client vào Server Component gây lỗi runtime
  `X.includes is not a function`, đã gặp và fix trong quá trình verify).
- `lib/data/coupons.ts`: thêm `AdminCouponFilters` + `getCouponsAdminPaginated`
  (lọc `storeId`/`type`/`isFeatured`/`isActive`/`verified`/`exclusive`, search
  qua `OR` title + `store.name`, không ép `isActive:true` như bản public).
- `lib/data/deals.ts`: thêm `AdminDealFilters` + `getDealsAdminPaginated`
  (có sentinel `eventId: null` cho filter "Uncategorized").
- `lib/data/blog.ts`: thêm `AdminBlogFilters` + `getBlogPostsAdminPaginated`
  (`orderBy: createdAt desc` — thay cho đoạn sort JS thừa trước đây ở
  `app/admin/blog/page.tsx`).
- `lib/data/reviews.ts`: thêm `getReviewsAdminPaginated` (không filter, chỉ
  phân trang) + `getPendingReviewCount()` (thay cho
  `reviews.filter(r=>!r.isApproved).length` trên mảng đã fetch full).
- 4 page (`app/admin/{coupons,deals,blog,reviews}/page.tsx`) đọc `searchParams`
  (`q`, `store`, `type`, `featured`, `status`, `verified`, `exclusive`,
  `event`, `first`, `page`, `size`) rồi gọi hàm paginated tương ứng.
- 4 table component (`components/admin/{Coupon,Deal,Blog,Review}Table.tsx`)
  bỏ `useState` filter + `useMemo filtered` + `useAdminPagination`, thay bằng
  `useSearchParams()` đọc giá trị filter hiện tại trực tiếp từ URL, và
  `navigate(updates)` = `router.push(buildQueryUrl(pathname, searchParams,
  updates))`. `<AdminPagination>` giữ nguyên 100% (chỉ đổi callback thành
  `navigate`). Bulk-delete/inline-edit (`AdminDropdownSelect`/`ToggleButton`,
  đã verify cả 2 đều tự `router.refresh()` sau PATCH) không cần sửa gì.

**Đợt 3 — Store admin table** (Store là bảng lớn nhất thực tế, ban đầu xếp
nhầm vào nhóm "giữ nguyên" — đã sửa lại theo đúng pattern trên):
- `lib/data/stores.ts`: thêm `AdminStoreFilters` + `getStoresAdminPaginated`
  (lọc `query`/`categoryId` qua `categoryIds:{has}`/`eventId` (có sentinel
  `null` cho "Uncategorized")/`isFeatured`/`isPin`/`isActive`).
- `app/admin/stores/page.tsx` đọc `searchParams` (`q`, `category`, `event`,
  `featured`, `pin`, `status`, `page`, `size`).
- `components/admin/StoreTable.tsx` chuyển sang `useSearchParams()` +
  `navigate()` giống Coupon/Deal/Blog/Review, giữ nguyên vị trí filter Category
  trong modal (không phải dropdown ở toolbar như Coupon/Deal).
- Verify qua script đăng nhập NextAuth: 22 total = 21 active + 1 hidden = 20
  featured + 2 not-featured (khớp cả 2 phép cộng), `event=uncategorized` → 0,
  search không khớp → hiện empty state, `page=1` vs `page=2` trả HTML khác
  nhau. `tsc`/`eslint` sạch.

**Không đụng (giữ nguyên client-side pagination):** Category, Event,
BlogTopic, Newsletter, Submission, RedirectRule, Author, Users — bảng
nhỏ/bounded, không đáng công sức chuyển đổi. `useAdminPagination.ts` vẫn giữ
cho các bảng này. Không đổi admin API routes.

## 3. Trạng thái hiện tại

- `npx tsc --noEmit` và `npm run lint` sạch, không lỗi.
- Dev server (`npm run dev`) chạy ổn định tại `http://localhost:3000`, đã
  smoke-test 200 OK cho: `/`, `/stores`, `/stores/A`, `/deals` (2 trang phân
  trang trả nội dung khác nhau), `/categories`, `/categories/houseware`,
  `/blog`, `/blog/[slug]`, `/blog?tag=`, `/store/[slug]`, `/api/search`,
  `/api/coupons?sort=discount` (thứ tự giảm dần đúng).
- Đã verify riêng cơ chế lazy-expiry: tạo coupon test hết hạn trực tiếp qua
  Prisma, gọi request public, xác nhận `isActive`/`isTrending`/`isFeatured`
  tự động chuyển `false` đúng như hành vi gốc — script test đã xoá sau khi
  chạy xong (không để lại code thừa trong repo).
- `npm run build` (static export, 249 trang) từng gặp lỗi kết nối tới
  Supabase pooler (`Can't reach database server` / `Timed out fetching
  connection from pool`) ở các trang không liên quan đến phần đã sửa (lỗi
  xảy ra ở `prisma.siteSetting.findUnique()` khi build 7 worker song song) —
  nhiều khả năng là giới hạn connection pool của gói Supabase free tier khi
  prerender nhiều trang cùng lúc, không phải do code trong session này gây
  ra, nhưng **chưa được xác nhận dứt điểm bằng một lần build thành công**.
- Migration index đã áp dụng lên DB thật qua `prisma db push` (không phải
  `migrate dev`) — không có migration file mới trong `prisma/migrations/`.
- **Admin pagination (đợt 2)**: `npx tsc --noEmit` + `npm run lint` sạch. Đã
  verify end-to-end bằng script đăng nhập qua NextAuth credentials flow (dùng
  `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` từ `.env`) rồi gọi trực tiếp các
  trang admin đã auth-gate: `/admin/coupons` (87 total = 82 active + 5 hidden,
  khớp phép cộng), `/admin/deals` (11 total, 6 uncategorized theo filter
  event), `/admin/blog` (10 total = 6 featured + 4 not-featured, khớp), search
  `q=off` narrow đúng còn 60, `page=1` vs `page=2` trả HTML khác nhau (phân
  trang thật), `/admin/reviews` pending count đúng qua query riêng. Trong quá
  trình verify phát hiện và fix 1 bug runtime: import hằng số `PAGE_SIZE_OPTIONS`
  từ file `"use client"` (`AdminPagination.tsx`) vào Server Component gây lỗi
  `.includes is not a function` — đã tách ra `lib/constants/admin.ts`. Script
  test đã xoá sau khi chạy xong.
- **Store admin (đợt 3)**: `tsc`/`eslint` sạch, verify qua script tương tự —
  số liệu khớp phép cộng (xem chi tiết ở mục "Đợt 3" trên).

## 4. Bước tiếp theo

- `npm run build` (static export, 249 trang) từng gặp lỗi kết nối tới
  Supabase pooler (`Can't reach database server` / `Timed out fetching
  connection from pool`) ở các trang không liên quan đến phần đã sửa (lỗi
  xảy ra ở `prisma.siteSetting.findUnique()` khi build 7 worker song song) —
  nhiều khả năng là giới hạn connection pool của gói Supabase free tier khi
  prerender nhiều trang cùng lúc, không phải do code gây ra, nhưng **chưa
  được xác nhận dứt điểm bằng một lần build thành công**. Cần chạy lại
  `npm run build` (có thể giảm số worker song song hoặc tăng
  `connection_limit` trong `DATABASE_URL`) để xác nhận.
- Sau khi deploy, theo dõi dashboard egress/bandwidth của Supabase để đo hiệu
  quả thực tế so với trước khi tối ưu.
- 7 bảng admin còn lại (Category, Event, BlogTopic, Newsletter, Submission,
  RedirectRule, Author, Users) vẫn dùng client-side pagination — cân nhắc
  chuyển tiếp nếu traffic/row-count tăng, theo đúng pattern đã thiết lập ở
  StoreTable/CouponTable/DealTable/BlogTable/ReviewTable.
- Test thủ công qua trình duyệt thật (không chỉ script HTTP): kiểm tra debounce
  ô search có mượt không, modal Filter có giữ đúng draft state khi mở lại
  không, và bulk-delete có giữ đúng trang hiện tại sau khi xoá.
