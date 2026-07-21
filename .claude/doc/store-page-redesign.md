# Store Page Redesign — Tóm tắt session

## 1. Mục tiêu

Redesign toàn bộ cụm trang Store/Category (`/stores`, `/stores/[letter]`, `/categories/[slug]`, `/categories/[slug]/stores`, `/store/[slug]`) theo phong cách tham khảo SimplyCodes, gộp nav "Categories" vào "Stores", và làm mượt trải nghiệm responsive + search.

## 2. Những phần đã hoàn thành

### `/stores` (Store directory)

**Hero** (`app/stores/page.tsx`)
- Full-bleed, dùng chung ảnh nền `/images/hero/home-hero.svg` với Home, padding `py-14 sm:py-20`
- Tiêu đề "Every store, one place to save." + mô tả, không hiển thị số liệu ảo
- Search box: **đã đổi từ `SearchBox` (form GET, `?q=` không được trang xử lý) sang `SearchAutocomplete`** (type-ahead thật, debounce 300ms, prefix-match qua `/api/search`, Enter điều hướng thẳng tới store đầu tiên) — theo `.claude/skills/search.md`
- Breadcrumb đặt trong `Container` riêng, ngay dưới hero (không nằm trong hero)

**`components/store/AlphabetNav.tsx`**
- Danh sách A–Z + "0-9", link thật tới `/stores/[letter]`
- 2 variant màu: `dark` (hero xanh) / `light` (mặc định)
- **Mới:** prop `onSelect?: (key: string | null) => void` — khi truyền vào, render `<button>` lọc tại chỗ (không điều hướng) thay vì `<Link>`; chọn lại chữ đang active sẽ bỏ lọc. Dùng cho bộ lọc chữ cái trên trang "View all stores" của category (xem bên dưới).

**`app/stores/[letter]/page.tsx`**
- `generateStaticParams` từ `groupStoresByLetter`, 404 nếu letter không hợp lệ/rỗng
- Item store dùng `components/store/StoreIndexGrid.tsx` (client, mới): `StoreCard` bản **compact** (bỏ mô tả, logo nhỏ, padding nhỏ), grid **6 cột** ở desktop (`grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6`), hiển thị **10 hàng/trang** (60 item), nút "Show more" (căn giữa) hiện thêm 10 hàng/lần

**Gộp nav Categories → Stores**
- `Header.tsx`/`MobileNav.tsx`: bỏ `Categories` khỏi `navLinks`; route `/categories` vẫn sống, chỉ ẩn khỏi nav

**"Find stores by category"** — `components/category/CategoryGrid.tsx`: 16 category/trang (4×4), "Show more" mở rộng dần

**"Browse top verified stores"** — `components/store/VerifiedStoresSection.tsx` (client):
- Tab "Most Popular": **không** còn lấy từ cờ `isFeatured` (giới hạn bởi `config.pagination.featuredStoresCount`, hiện đang là 20 và Home carousel vẫn dùng số này) — đổi sang xếp hạng độc lập **top 40** toàn site theo `lastMonthClicks` (tái dùng `rankPopularStores()` từ `lib/content/popularStoresRefresh.ts`), không đụng tới cờ `isFeatured`/Home
- Mỗi tab category: xếp hạng **riêng trong chính category đó** (không giới hạn phải nằm trong top-40 Most Popular), cap **25 store/tab**, cũng qua `rankPopularStores()`
- Tab dạng cuộn ngang (`overflow-x-auto`), bo góc `rounded-xl`
- Mỗi `StoreCard` hiển thị "{N} verified"

**`components/store/StoreCard.tsx`** (mở rộng, backward-compatible)
- `countLabel?`, `pluralizeLabel?` (đã có từ trước)
- **Mới:** `compact?: boolean` — ẩn mô tả, logo/padding nhỏ hơn (dùng cho `StoreIndexGrid`)
- **Mới:** tên store `truncate` (1 dòng, "…" nếu dài)

**"Complete store index"** — grid 27 ô A–Z+0-9, số liệu thật từ `groupStoresByLetter`

**Đã xóa:** value-prop strip cũ, callout "Suggest a store", coupon count trên `CategoryCard` ở `/stores`

### `/categories` (index) và `/categories/[slug]`

- **`/categories`**: xóa số đếm coupon trên mỗi `CategoryCard` (`showCount={false}`), bỏ fetch `getActiveCouponCountByCategory()` không dùng nữa
- **`/categories/[slug]` — Banner đầu trang** (thay `<h1>`+`<p>` phẳng): card gradient `bg-linear-to-br from-brand-600 to-brand-800`, icon category (`renderCategoryIcon`) trong badge tròn `bg-white/15`, tên + mô tả căn giữa, chữ trắng
- **"Top stores"** → `components/store/StoreGrid.tsx`: hiển thị cố định **3 hàng (15 item)**, không còn "Show more" mở rộng tại chỗ — thay bằng nút/link **"View All"** dẫn tới `/categories/[slug]/stores` (component giờ là Server Component thuần, không cần `"use client"`)
- **Trang mới `/categories/[slug]/stores`**: breadcrumb Stores → Category → "All stores"; header nhỏ (icon badge nhạt màu `bg-brand-50`, tên category + "Showing N verified stores"); danh sách dùng `components/store/CategoryStoresGrid.tsx` (client) — có **bộ lọc theo chữ cái** (tái dùng `AlphabetNav` ở chế độ `onSelect`) + nút **"Show more"** 50 store/lần (đã đổi từ cơ chế infinite-scroll/`IntersectionObserver` ban đầu sang nút bấm theo yêu cầu)
- **"Coupons & deals" → "Best {Category Name} Coupon"**:
  - Đổi từ list dọc `CouponCard` sang grid `CouponGridCard` (5/hàng desktop)
  - Dữ liệu: `getBestCategoryCoupons(categoryId, period, limit=20)` (`lib/data/coupons.ts`) — chọn 20 coupon **ưu tiên exclusive**, còn lại random có seed, **dedupe 1 coupon/store** (`dedupeByStore`), cache **1 tháng/lần** (key gồm UTC period `YYYY-MM` qua `getUtcPeriodKey`, `unstable_cache` với `revalidate: false` → tự invalidate đúng lúc 00:00 UTC ngày 1 hàng tháng nhờ đổi key, không cần cron/bảng riêng)
  - `lib/utils.ts`: thêm `seededShuffle()` (mulberry32 PRNG, deterministic theo seed) làm nền cho "random nhưng ổn định" ở trên
- **FAQ**: cả 25 category (không chỉ 8 category gốc trong `data/categories.json` — 17 category còn lại được tạo qua admin UI, chỉ tồn tại trong DB) đều có đúng **5 câu hỏi**, và các câu trả lời đã được **viết dài hơn** (3 câu/answer thay vì 1 câu) — toàn bộ nội dung này nằm trong DB (Prisma/Postgres), **không phải** `data/categories.json` (file JSON chỉ là seed ban đầu, đã lệch khỏi DB từ lâu)

### `/store/[slug]` (Store detail)

- **Tiêu đề**: `"{Store} coupons & deals"` → `"{Store} Promo Codes & Coupons - {Month} {Year}"` (VD: "Swiss Chems Promo Codes & Coupons - July 2026"), cỡ chữ tăng `text-2xl` → `text-3xl sm:text-4xl`
- **`components/coupon/StoreCouponCard.tsx`** (mới) — item coupon riêng cho trang này (không đụng `CouponCard` dùng chung ở `/deals`, `/events/[slug]`, `/coupon/[slug]`):
  - Desktop (`sm:` trở lên): layout ngang — cột discount to bên trái (tách chữ số/label từ `formatDiscount()`), logo nhỏ + tên store, tiêu đề, badge Verified, nút Code/Deal width cố định `w-40` (yêu cầu 2 nút bằng nhau)
  - Mobile (dưới `sm`): tự động chuyển sang layout dọc `CouponGridCard` (tái dùng component có sẵn) — **2 item/hàng** (`grid grid-cols-2 sm:grid-cols-1` ở `StoreCouponTabs`), có `h-full` xuyên suốt để 2 card cùng hàng cao bằng nhau dù badge/tiêu đề wrap khác dòng
  - Badge "Top pick" (góc trái, nổi trên card) — chỉ hiện ở item đầu tiên **nếu** nó là exclusive hoặc có code (không hiện nếu item đầu chỉ là deal thường)
- **`components/store/StoreCouponTabs.tsx`**:
  - Sắp xếp ưu tiên **exclusive > có code > deal thường** (`couponRank`/`sortByPriority`), áp dụng cho mọi tab (All/Verified/Codes/Deals)
  - Tab nav: bo góc `rounded-xl` (từ `rounded-full`), width rộng hơn/height thấp hơn (`px-6 py-1.5`), cuộn ngang (`overflow-x-auto` + `shrink-0`) khi responsive thay vì wrap/vỡ layout
- **`components/store/StoreHeader.tsx`** (sidebar bên trái):
  - Bỏ hiển thị sao đánh giá (`StoreRating`) — component giờ **không còn được import ở đâu**, chưa xóa file
  - Logo: bỏ viền, thêm `shadow-lg`; tăng size `lg`→`xl` (112px)
  - 3 cột thống kê (Total coupons / Active deals / Best offer): đồng bộ **cùng size** `text-lg font-normal text-black`, `whitespace-nowrap` (đặc biệt Best offer để không bị xuống dòng); Best offer bỏ pill/`Badge`, chỉ hiện chữ thường
  - Mô tả ngắn: chuyển xuống **dưới** khối thống kê, thêm tiêu đề "Short description", căn `text-justify`; **ẩn hoàn toàn khi responsive** (`hidden sm:block`)
- **"Related stores"**: tăng từ 4 lên tối đa **10 item** (`getRelatedStores(store, 10)`), grid **5/hàng** (tối đa 2 hàng) thay vì 4/hàng; thêm nút **"View all"** (căn giữa) dẫn tới `/categories/${store.categoryIds[0]}` (category đầu tiên của store đó)
- **`components/coupon/CouponGridCard.tsx`** (dùng chung, ảnh hưởng cả Home/category "Best Coupon"): logo/avatar giờ link tới **`/store/[slug]`** thay vì `/coupon/[slug]` — đồng bộ với quy ước "click logo → trang store" ở khắp nơi khác trong app

## 3. File đã sửa / tạo (tính từ đầu session)

**Sửa:**
- `app/stores/page.tsx`, `app/stores/[letter]/page.tsx`
- `app/categories/page.tsx`, `app/categories/[slug]/page.tsx`
- `app/store/[slug]/page.tsx`
- `components/layout/Header.tsx`, `components/layout/MobileNav.tsx`
- `components/store/StoreCard.tsx`, `components/store/AlphabetNav.tsx`, `components/store/StoreGrid.tsx`, `components/store/StoreHeader.tsx`
- `components/store/StoreCouponTabs.tsx`
- `components/coupon/CouponGridCard.tsx`
- `components/category/CategoryChip.tsx`
- `lib/data/coupons.ts` (thêm `getBestCategoryCoupons`, `dedupeByStore`)
- `lib/utils.ts` (thêm `seededShuffle`)
- `.claude/skills/search.md` (cập nhật danh sách "Already applied to")
- Nội dung FAQ 25 category trong DB (không phải file JSON)

**Tạo mới:**
- `components/store/AlphabetNav.tsx`, `components/category/CategoryGrid.tsx`, `components/store/VerifiedStoresSection.tsx`
- `components/store/StoreIndexGrid.tsx` (compact grid cho `/stores/[letter]`)
- `components/store/CategoryStoresGrid.tsx` (trước là `InfiniteStoreGrid.tsx`, đã đổi cơ chế từ infinite-scroll sang nút Show more)
- `app/categories/[slug]/stores/page.tsx` (trang "View all stores" theo category)
- `components/coupon/StoreCouponCard.tsx`

**Đã xóa (không còn dùng):**
- `components/store/InfiniteStoreGrid.tsx` (đổi tên/thiết kế lại thành `CategoryStoresGrid.tsx`)

## 4. Trạng thái hiện tại

- Dev server chạy ổn định tại `http://localhost:3000`; đã verify qua `curl` cho tất cả route: `/stores`, `/stores/[letter]`, `/categories`, `/categories/[slug]`, `/categories/[slug]/stores`, `/store/[slug]`
- `npm run typecheck` và `npm run lint` sạch (chỉ còn 1 warning cũ, không liên quan: biến `_store` unused trong `lib/server/affiliate/redirect.ts`)
- **Lưu ý quan trọng đã phát hiện trong session:** category data thật sự sống trong Postgres (Prisma), không phải `data/categories.json` — file JSON chỉ là seed ban đầu và đã lệch khỏi DB (DB có 25 category, JSON chỉ có 8; nhiều slug cũng đã đổi qua admin UI). Mọi thay đổi nội dung category (FAQ, v.v.) phải update trực tiếp DB, không chỉ sửa JSON.
- **Cảnh báo cache dev server:** `unstable_cache` với `revalidate` dài hoặc `false` có thể serve dữ liệu cũ sau khi update DB trực tiếp (không qua `revalidateTag`), vì Next.js dev lưu persistent fetch-cache tại `.next/dev/cache/fetch-cache` sống sót qua cả restart nếu không xoá thủ công. Khi update DB bằng script ngoài app (không qua `purgeTag`), cần xoá thư mục này **và** restart dev server để thấy thay đổi.
- Dead code hiện tại (chưa xoá, chưa được yêu cầu xoá):
  - `components/store/StoreListAZ.tsx` (không còn import ở đâu)
  - `components/store/StoreRating.tsx` (không còn import ở đâu sau khi bỏ sao đánh giá khỏi `StoreHeader`)
- `components/deal/DealsHero.tsx` (`/deals`) vẫn dùng `SearchBox` cũ (form GET), **chưa** được chuyển sang `SearchAutocomplete`

## 5. Bước tiếp theo (khi mở lại session)

- Cân nhắc xóa `StoreListAZ.tsx` và `StoreRating.tsx` (cả hai đều dead code)
- Cân nhắc chuyển `SearchBox` trên `/deals` (`DealsHero.tsx`) sang `SearchAutocomplete` cho nhất quán (nếu muốn)
- Đồng bộ hoặc bỏ qua link "Categories" còn sót trong footer seed (`DEFAULT_FOOTER_SETTINGS`, `lib/data/settings.ts`)
- Chưa test thực tế trên mobile/thiết bị thật, mới verify qua curl + đọc code (đặc biệt phần responsive 2-cột mobile ở `/store/[slug]` và bộ lọc chữ cái ở `/categories/[slug]/stores`)
- Cân nhắc thêm `/stores/[letter]` và `/categories/[slug]/stores` vào `app/sitemap.ts` nếu cần tối ưu SEO (hiện chưa có)
- Đồng bộ lại `data/categories.json` với DB nếu muốn file seed phản ánh đúng 25 category + FAQ dài hiện tại (không bắt buộc, chỉ ảnh hưởng khi seed lại DB từ đầu)
