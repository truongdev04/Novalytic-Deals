# Home Page UI — Session Summary

## 1. Mục tiêu

Redesign toàn bộ trang chủ (`app/page.tsx`): thanh search Header/Hero, section "Popular stores", thêm 2 section mới, đổi "Today's best deals" sang dùng dữ liệu `Deal` thật, cùng loạt chỉnh sửa nhỏ về typography/UX theo phản hồi qua từng vòng screenshot.

## 2. Những phần đã hoàn thành

**Thanh Search (Header + Hero)**
- `components/search/SearchAutocomplete.tsx`: viết lại hoàn toàn thành client component tự làm live-search — debounce 300ms gọi `/api/search?q=` (route có sẵn), chỉ lấy `stores`, sort theo độ khớp tên; dropdown gợi ý; **Enter** → có kết quả thì vào thẳng `/store/[slug]` của gợi ý đầu, không có thì vô hiệu + hiện "No results found"; click ra ngoài/Esc đóng dropdown; icon kính lúp trái + nút X xoá phải; bo góc `rounded-xl` khớp bảng gợi ý.
- `components/search/SearchBox.tsx` (dùng ở `/stores`, `/deals`, `MobileNav`): default `action` đổi `/search` → `/stores`, bỏ prop `listId` chết.
- **Xoá hẳn trang `/search`** (`app/search/page.tsx`) — dọn theo: `app/sitemap.ts` (bỏ entry), `lib/seo/jsonld.ts` (`SearchAction.target` trỏ `/stores?q=`).
- `components/layout/HeaderMobileSearch.tsx` (mới): icon search riêng cho mobile (`md:hidden`), bấm xổ ra `SearchAutocomplete` dạng dropdown dưới header.
- `components/layout/Header.tsx`: bỏ nút "Browse Deals", bỏ link "Home", bỏ Slogan/Top Description (chuyển sang Hero), dọn `getStores()`/`getCategories()` không còn cần.
- `components/layout/MobileNav.tsx`: bỏ "Home" khỏi nav, bỏ hẳn `SearchBox` và nút "Browse Deals" trong menu slide-out.
- `components/home/Hero.tsx`: đọc `getGeneralSettings()` — `slogan` làm H1, `topDescription` làm subtext (fallback text cũ khi rỗng); bỏ nút "Shop now"; ô search to hơn (`h-[58px]`, rộng `sm:w-3/5`); fix `overflow-hidden` ở `<section>` gây cắt mất dropdown gợi ý (chuyển `overflow-hidden` riêng vào wrapper ảnh nền).
- `components/admin/GeneralSettingsForm.tsx`: cập nhật hint text Slogan/Top Description (giờ nói "Hero" thay vì "header").

**Section "Popular stores"**
- Cài mới `embla-carousel-react` + `embla-carousel-autoplay`.
- `components/store/StoreCarousel.tsx` (mới): carousel auto-chuyển mỗi 5s (`stopOnInteraction:false, stopOnMouseEnter:true`), vuốt tay, dot pagination; responsive 2→3→4→5 item/hàng.
- `components/store/PopularStoreCard.tsx` (mới, tách riêng khỏi `StoreCard.tsx` gốc vì component đó còn dùng ở Related Stores/Category/Event): logo tròn `object-cover` full khung (không còn `object-contain`+padding gây hở/méo), chỉ còn tên store (bỏ mô tả + số coupon); `h-full` để các item cùng hàng cao bằng nhau; hover: `-translate-y-1`, viền + shadow đậm hơn, logo `scale-105` + đổi màu viền.
- `components/store/StoreLogo.tsx`: thêm size `xs` (24px, trước chỉ có sm/md/lg).

**Section mới + thứ tự trang chủ**
- Thứ tự mới: Popular stores → **Today's best deals** → **Trending coupon** (mới) → **NovalyticDeals Exclusive Codes** (mới) → Popular categories → How It Works → Why Trust Us → Blog.
- `lib/data/coupons.ts`: thêm `getExclusiveCoupons()` (coupon `exclusive=true`), xoá `getTrendingDeals()` (không còn ai gọi).
- "Trending coupon" dùng `getFeaturedCoupons()` (`Coupon.isFeatured`) — **không** dùng `isTrending` vì field đó đã bị "Today's best deals" chiếm trước đó và không còn toggle ở Admin CouponForm.
- Fix bug phụ: `storeById` trước đó chỉ build từ Featured Stores (8 store) trong khi coupon/deal các section mới lấy từ toàn site → nhiều item bị rớt âm thầm + đếm sai số coupon/category. Đã thêm `getStores()` (toàn bộ) để build `storeById` đầy đủ.

**"Today's best deals" đổi sang model `Deal` thật**
- Phát hiện có sẵn Prisma model `Deal` (khác `Coupon`) + admin module `/admin/deals` đã có dữ liệu thật (`imageUrl`, `price`, `originalPrice`, `offer`, `type: DEAL|CODE`) nhưng **chưa từng wire ra public**.
- `lib/data/deals.ts`: thêm `getFeaturedDeals(limit)` (lọc `isFeatured && isActive`, cache 300s) — trước đó chỉ có hàm phục vụ admin.
- `components/deal/DealProductCard.tsx` (mới): ảnh sản phẩm (`aspect-4/3`, `object-contain`) → logo+tên store (size `xs`) → badge `offer` (accent) + badge "Code" nếu `type=CODE` (brand) → giá `$price` đậm + `$originalPrice` gạch ngang → tên deal (`font-semibold text-brand-950`, không còn màu xám giống mô tả) → nút CTA full-width `rounded-xl` (khớp bo góc ô search).
- `components/deal/DealCta.tsx` (mới): `type=CODE` → modal copy code + nút "Continue to {Store}"; `type=DEAL` → mở thẳng `deal.url` tab mới. **Lưu ý:** Deal không có route `/go/[id]` để log click như Coupon → mở link trực tiếp client-side, không track được.
- `app/page.tsx`: "Today's best deals" grid `2→3→5` cột (`lg:grid-cols-5`), fetch qua `config.pagination.bestDealsCount` (field admin đã tự thêm vào Content Configuration cùng `exclusiveCodesCount`, tách khỏi `trendingDealsCount` dùng chung trước đó).

**Coupon FREESHIP/DEAL (liên quan card hiển thị trên home qua `DiscountBadge`/`StoreCouponTabs`)**
- `lib/utils.ts` `formatDiscount()`: nhận thêm `couponType`, `FREESHIP` → "FREE SHIPPING" thay vì "DEAL" cứng.
- `components/admin/CouponForm.tsx`: ẩn Discount Type/Value/Currency khi `Type=FREESHIP` (tự set `OTHER`/`0`); để trống Code + `Type=CODE` → tự chuyển `DEAL` lúc submit.
- `components/store/StoreCouponTabs.tsx`: tab Codes/Deals phân loại theo `Boolean(coupon.code)` thay vì `coupon.type` (khớp đúng nút "Show Code"/"Get Deal").

**Typography site-wide** (áp dụng luôn cho card trên trang chủ)
- `components/ui/Badge.tsx`: `text-xs`→`text-sm`.
- `StoreCard.tsx`/`CategoryCard.tsx` title: `text-sm`→`text-base`. `CouponCard.tsx`/`DealCard.tsx`/`BlogCard.tsx` title: `text-base sm:text-lg`.
- `SectionHeader.tsx`: `text-2xl sm:text-3xl`→`text-3xl sm:text-4xl`. `Header.tsx` brand: `text-lg`→`text-xl`. `StoreHeader.tsx` h1: `text-xl`→`text-2xl`, stat số: `text-lg`→`text-xl`. `app/coupon/[slug]/page.tsx` h1: `text-2xl sm:text-3xl`→`text-3xl sm:text-4xl`.

## 3. Trạng thái hiện tại

- Dev server chạy ổn định tại `http://localhost:3000` (Turbopack hot-reload); `typecheck`/`lint`/`build` sạch xuyên suốt mọi vòng sửa (chỉ còn 1 warning cũ không liên quan ở `lib/server/affiliate/redirect.ts`).
- DB hiện chỉ có **2 Deal** đang `isFeatured=true && isActive=true` → hàng "Today's best deals" (5 cột) còn trống chỗ cho tới khi feature thêm deal qua Admin.
- Toàn bộ tương tác thật trong trình duyệt (vuốt carousel, gõ search + Enter, toggle icon search mobile, mở modal code Deal) **chưa tự test được** — không đăng nhập/thao tác UI qua script trong session này, chỉ verify qua `typecheck`/`lint`/`build` + 1 lần đọc trực tiếp DB (read-only) xác nhận có dữ liệu Deal thật.

## 4. Bước tiếp theo (đã xử lý ở phần 5)

- ~~Mở trình duyệt test tay...~~ → đã verify qua Chrome headless (xem phần 5).
- ~~Feature thêm Deal trong Admin...~~ → xem phần 5, mục Trending coupon.
- Cân nhắc lại mapping data cho "Trending coupon" (`isFeatured`) — nếu muốn tách biệt rõ hơn khỏi khái niệm "Featured" ở nơi khác, có thể cần tiêu chí riêng (vd theo `upvotes`/`usageCount`).
- Field `isTrending` trên `Coupon` giờ hoàn toàn mồ côi (còn trong schema/type, không còn nơi nào đọc, không có toggle ở Admin) — cân nhắc dọn hẳn ở dịp khác nếu chắc chắn không cần lại.
- Chưa có trang public `/deal/[slug]` — ảnh/tên trong `DealProductCard` tạm link về trang Store làm fallback.

## 5. Session tiếp theo: bo góc site-wide, dialog code, multi-tab Show Code, Trending coupon

**Bo góc đồng bộ toàn frontend public**
- Thống nhất mọi input/button ở frontend public (không đụng admin) về `rounded-xl` khớp ô search, giữ nguyên `rounded-full` cho phần tử tròn thật (badge, avatar, nút vote, icon-button).

**Ảnh sản phẩm `DealProductCard` — bo góc đúng cách**
- Gốc rễ: `next/image` chế độ `fill` luôn kéo `<img>` full khung cha bất kể `object-fit`, nên `rounded-xl` chỉ bo cái khung ngoài chứ không bo theo pixel ảnh thật (khi `object-contain` ảnh nhỏ hơn khung). Test `object-cover` thì bo được nhưng ảnh bị crop xấu → revert.
- Fix đúng: bỏ `fill`, dùng kích thước cố định (`width={640} height={480}`) + class `h-auto max-h-full w-auto max-w-full` bên trong `flex items-center justify-center` → khung `<img>` co đúng theo ảnh hiển thị, `rounded-xl` bo đúng viền ảnh thật (`components/deal/DealProductCard.tsx`).
- Padding ảnh chỉnh bất đối xứng `pt-3 px-1.5 pb-1` (giữ top rộng theo yêu cầu, thu hẹp 2 bên/dưới để ảnh to hơn); nội dung card thu gọn theo (`p-2.5`, badge `px-2 py-0.5 text-xs`).
- Badge giảm giá: `rounded-xl`, chữ đỏ `text-red-600` (theo `b6.png`), chỉ override tại chỗ này chứ không đổi `Badge` dùng chung.
- Click vào ảnh = click "Get Deal"/"Show Code" (cùng 1 `handleTrigger`, cùng state `open` với dialog) — không còn link riêng về trang Store.

**`CodeRevealDialog` (mới) — dialog "Get/Show Code" dùng chung mọi nơi**
- File mới `components/coupon/CodeRevealDialog.tsx`, tự dựng trên `@radix-ui/react-dialog` (không dùng `components/ui/Modal.tsx` để tránh ảnh hưởng các modal admin đang dùng chung Modal).
- Layout theo mockup `b9.png`: avatar logo store tròn, tiêu đề giá trị giảm giá to đậm, subtitle, bubble "Copied to your clipboard!" nổi khi auto-copy code lúc mở dialog, ô code dạng pill (co theo nội dung, không rộng bằng nút CTA, `truncate` khi code quá dài), khối Yes/No "Did this code work?" (chỉ Coupon có, Deal không có vote model nên bỏ hẳn thay vì giả dữ liệu), nút CTA.
- Theo yêu cầu người dùng: **nút CTA giữ nguyên style/hành vi cũ** (`variant="accent"` cam), không đổi màu theo mockup.
- Sau khi làm xong theo tông tối của mockup, người dùng yêu cầu đổi lại bảng màu sáng đồng nhất với web nhưng **giữ layout mới** — đã áp dụng (`bg-surface-0`, `text-brand-950`, v.v.), không phải revert layout.
- Polish thêm: dialog to hơn (`max-w-sm`→`max-w-md`, `p-6`→`p-8`), khoảng cách ô code↔nút CTA cho case Deal (không có Yes/No) nới rộng hơn (`mt-10` thay vì `mt-6`), fix bug tự phát hiện: bubble "Copied" đè lên subtitle → tăng margin top của khối code.
- Hook mới `lib/hooks/useCouponVote.ts` tách logic vote (optimistic update + `POST /api/coupons/[id]/vote`) dùng chung giữa `VoteButtons.tsx` (trang chi tiết coupon, có hiện số) và Yes/No trong dialog (không hiện số).
- `StoreLogo.tsx` thêm size `xl` (112px) cho avatar dialog/Trending coupon.

**Multi-tab "Show Code" (theo `b10.png`, kiểu simplycodes.com)**
- Khi bấm "Show Code": tab hiện tại điều hướng thẳng tới store (`window.location.href = /go/[id]` hoặc `deal.url`), đồng thời mở thêm 1 tab mới là bản sao trang hiện tại với dialog tự động bật sẵn (đã reveal code).
- Cơ chế handoff qua `localStorage` (không dùng `sessionStorage` vì `window.open` dùng `noopener,noreferrer` theo convention bảo mật của repo, `sessionStorage` sẽ không nhân bản sang tab phụ trong trường hợp đó): `setPendingCodeReveal(id)` trước khi mở tab mới, tab mới đọc `consumePendingCodeReveal(id)` trong `useEffect` (có guard hết hạn 10s) rồi `queueMicrotask(() => setOpen(true))` để tránh lỗi lint `react-hooks/set-state-in-effect`. Cả 2 hàm nằm trong `lib/utils.ts`.
- Áp dụng cho cả Coupon "Show Code" (`CouponCodeModal.tsx`) và Deal "Show Code" (`DealProductCard.tsx`, ảnh + nút dùng chung 1 handler). "Get Deal" (không có code) giữ nguyên hành vi cũ hoàn toàn.

**Trending coupon — 5 item/hàng + thiết kế lại**
- Vấn đề: `DealCard.tsx` bị dùng chung bởi cả "Trending coupon" và "NovalyticDeals Exclusive Codes" → không sửa thẳng để tránh vô tình đổi luôn Exclusive Codes.
- Giải pháp: file mới `components/coupon/TrendingCouponCard.tsx` — theo đúng ngôn ngữ hình ảnh của `DealProductCard` (logo tròn `size="xl"` thay ảnh sản phẩm, badge nhỏ gọn, nút full-width bo góc), tái dùng nguyên `DiscountBadge`, `VerifiedBadge`, `CouponCodeModal` (không viết lại logic reveal/copy/multi-tab).
- Thêm `className?` optional (additive, không phá chỗ gọi cũ) vào `DiscountBadge.tsx`, `VerifiedBadge.tsx`, `CouponCodeModal.tsx` để card mới tuỳ biến size/full-width.
- `app/page.tsx`: lưới "Trending coupon" đổi `grid-cols-1 sm:2 lg:3` (dùng `DealCard`) → `grid-cols-2 sm:3 lg:5` (dùng `TrendingCouponCard`), khớp breakpoint với "Today's best deals". Section "Exclusive Codes" ngay dưới **không đổi** (vẫn `DealCard` + 3 cột).
- Đã xoá 2 file không còn ai import: `components/deal/DealCta.tsx` (logic gộp vào `DealProductCard.tsx`), `components/coupon/CopyCodeButton.tsx` (gộp vào `CodeRevealDialog.tsx`).

**Trạng thái cuối phần 5**
- `typecheck`/`lint` sạch xuyên suốt (chỉ còn cảnh báo cũ không liên quan ở `lib/server/affiliate/redirect.ts`).
- Đã verify trực quan bằng Chrome headless + Chrome DevTools Protocol (không có `chromium-cli` trong môi trường này) ở nhiều breakpoint cho từng thay đổi: bo góc ảnh Today's best deals, dialog code (light theme, bubble copy, truncate code dài), và lưới Trending coupon (5 cột desktop / 3 tablet / 2 mobile, Exclusive Codes không đổi).
- Chưa test tay swipe carousel / gõ search thật trên trình duyệt người dùng thật (chỉ qua headless script) — vẫn là việc còn treo từ phần 4 nếu cần double-check cảm giác thật.

## 6. Session tiếp theo: fix bug crooked card, CouponGridCard hợp nhất, logo Popular stores, search prefix-match, Submit a coupon

**`TrendingCouponCard` → `CouponGridCard` (hợp nhất Trending coupon + Exclusive Codes)**
- Bug phát hiện qua screenshot: nút "Show Code"/"Get Deal" giữa các card cùng hàng bị lệch (crooked) khi tiêu đề coupon dài ngắn khác nhau. Nguyên nhân: `flex-1` đặt nhầm trên `<h3>` (cháu) thay vì trên `<Link>` bọc nó (con trực tiếp của flex container) — spacer không hoạt động.
- Đổi tên file `TrendingCouponCard.tsx` → `components/coupon/CouponGridCard.tsx`, sửa `flex-1` sang đúng `<Link>`. Tái dùng luôn component này cho section "NovalyticDeals Exclusive Codes" (trước đó dùng `DealCard.tsx` banner ngang riêng) — `app/page.tsx` cả 2 section giờ cùng lưới `grid-cols-2 sm:3 lg:5` + `CouponGridCard`.
- Xoá `components/coupon/DealCard.tsx` (hết importer sau khi hợp nhất).

**`CouponCodeModal.tsx` — 2 cải tiến UX "Show Code"**
- Thêm prop `newTabHref?`: khi bấm "Show Code" từ trang listing (Trending coupon/Exclusive Codes trên home), tab phụ (sister tab) mở đúng `/store/[slug]` của coupon đó thay vì nhân bản trang home như trước — `CouponGridCard` truyền `newTabHref={`/store/${store.slug}`}`; mọi nơi khác (trang coupon, trang Store, `/deals`...) không truyền gì nên giữ nguyên hành vi cũ (nhân bản trang hiện tại).
- Thêm state `revealed`: một khi dialog đã mở ít nhất 1 lần (bấm tay hoặc tự động qua pending-flag ở tab phụ), nút "Show Code" chuyển hẳn thành pill hiện mã (monospace, viền/nền brand) + nút "Copy" riêng, không cần bấm lại mới thấy mã. Bấm vào pill vẫn mở lại dialog (xem terms/vote).

**`CategoryCard.tsx` — bỏ số coupon ở "Popular categories" trên home**
- Thêm prop `showCount?` (mặc định `true`). Home truyền `showCount={false}`; trang `/categories` không đổi (vẫn hiện số). `app/page.tsx` bỏ luôn phần tính `couponCountByCategory` + fetch `getCoupons()` không còn dùng.

**`PopularStoreCard.tsx` — 2 vòng fix lỗi hiển thị logo**
- Vòng 1: `fill` + `object-cover` làm logo dạng chữ ngang (vd "Natural Tallow") bị crop/zoom vào 1 dải mờ ở giữa ảnh. Vòng 2 (sau khi sửa vòng 1 bằng cách thêm `p-4` + `object-contain` thủ công): logo vuông (vd "Tiptoe") lại bị co nhỏ, nổi lùng bùng có khoảng trắng quanh viền tròn.
- Fix triệt để: bỏ hẳn `fill`, `p-4`, `object-contain` — chỉ còn `<Image width={128} height={128} sizes="128px">` trần, dựa vào rule Preflight toàn cục của Tailwind v4 (`img{max-width:100%;height:auto}`, xác nhận có trong `app/globals.css`) để browser tự tính đúng tỉ lệ thật, giống hệt kỹ thuật `StoreLogo.tsx` đang dùng cho Trending coupon (nơi không hề bị lỗi này).

**`SearchAutocomplete.tsx` — chỉ gợi ý theo tiền tố tên store**
- Bug: gõ "swi" gợi ý cả "Chosfox" (không liên quan) vì `searchStores()` API khớp luôn cả `description` ("keyboard **swi**tches"). Sửa: dropdown gợi ý giờ lọc client-side, chỉ giữ store có **tên bắt đầu bằng** đúng từ khóa (`startsWith`, không phải `includes`), sort alphabet. Không đổi `searchStores()`/`/api/search` gốc vì hàm đó còn phục vụ tìm kiếm rộng ở trang `/stores`.

**`BlogCard.tsx` — cùng bug crooked như CouponGridCard**
- Ngày/read-time ở "From our blog" bị lệch hàng do card không stretch nội dung theo chiều cao hàng. Thêm `flex h-full flex-col` cho `article`, `flex flex-1 flex-col` cho khối nội dung, `flex-1` cho đoạn excerpt để làm spacer đẩy dòng ngày/read-time luôn sát đáy, thẳng hàng.

**"Submit a coupon" — thêm Website Link + Discount**
- `prisma/schema.prisma`: thêm `websiteUrl`, `discountUnit` (`%`/`$`/`€`/`£`), `discountValue` vào model `SubmittedCoupon` (bắt buộc). Áp dụng lên DB dev thật bằng `prisma db push` thay vì `migrate dev` vì migration history đã bị lệch (drift) từ trước với DB — `migrate dev` đòi reset toàn bộ DB nên tránh dùng; đã backfill dòng dữ liệu test cũ có sẵn.
- `lib/validators/submitCoupon.ts`: validate 2 field mới; `discountValue` dùng `z.number({ error: ... })` (không phải `z.coerce.number()`) để khớp convention `valueAsNumber: true` đã dùng ở `admin/coupon.ts`, tránh lỗi Zod v4 generic khi input rỗng → NaN.
- `components/forms/SubmitCouponForm.tsx`: field "Link Website" (input URL) ngay dưới "Store name"; field "Discount" (dropdown đơn vị ghép liền ô số có spinner, bo góc chung 1 khối) ngay dưới "Coupon code" — thiết kế theo mockup người dùng cung cấp.
- `app/api/submit-coupon/route.ts` + `lib/data/submittedCoupons.ts`: truyền 2 field mới xuống Prisma create.
- `components/admin/SubmissionTable.tsx`: thêm cột "Website" (link) và "Discount" để dữ liệu mới không bị vô hình ở màn hình duyệt submission.

**Trạng thái cuối phần 6**
- `typecheck`/`lint` sạch xuyên suốt (chỉ còn cảnh báo cũ không liên quan ở `lib/server/affiliate/redirect.ts`).
- Verify qua Chrome headless cho từng fix: card thẳng hàng (Trending coupon/Exclusive Codes/Blog), logo Popular stores đúng cho cả 3 dạng (chữ ngang, vuông, tròn có padding sẵn), search "s"/"ho" chỉ gợi ý đúng tiền tố, form Submit a coupon hiện đúng layout + validate + payload gửi đi đúng shape (dùng kỹ thuật spy `window.fetch` vì Turnstile chặn submit thật trong môi trường test).
- DB dev (Supabase) đã có schema mới cho `submitted_coupons`; chưa verify được màn `/admin/submissions` bằng screenshot thật vì route yêu cầu đăng nhập và không có sẵn credential trong phiên — đã xác nhận đúng qua typecheck + đọc trực tiếp shape dữ liệu trong DB.
