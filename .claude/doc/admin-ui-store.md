# Admin UI Session — 2026-07-03

## 1. Mục tiêu

Chỉnh sửa toàn diện khu vực admin: Dashboard, layout scroll, phân trang danh sách, bảng quản lý Store, và form thêm/sửa Store (bao gồm upload ảnh thật + rich text editor).

## 2. Những phần đã hoàn thành

### Dashboard (`app/admin/page.tsx`)

- Bỏ thẻ "Total Clicks"; overview còn 6 thẻ: Stores, Coupons, Deals, Categories, Blog Posts, Subscribers (`getOverviewCounts()` mới trong `lib/data/admin/analytics.ts`).
- 2 biểu đồ (click theo thời gian, top store theo click) dùng chung bộ lọc thời gian (Hôm nay/Hôm qua/7 ngày/Tháng này/Tuỳ chọn/Từ trước đến nay) qua `resolveDashboardRange()`, `getClicksSeriesForRange()`, `getTopStoresByClicksRange()`; vẽ bằng `recharts` (mới cài) trong `components/admin/ClicksLineChart.tsx`, `TopStoresBarChart.tsx`.
- Giữ banner review/submission chờ duyệt.

### Layout & phân trang

- `app/admin/layout.tsx`: đổi `min-h-screen` → `h-screen overflow-hidden`, `<main>` nhận `overflow-y-auto` để sidebar/topbar đứng yên khi cuộn nội dung.
- `lib/hooks/useAdminPagination.ts` + `components/admin/AdminPagination.tsx`: phân trang client-side (Pre/Next, page-size 20/50/100/200, "Showing X-Y of Z"), **ẩn hoàn toàn nếu tổng item ≤ 20**. Áp dụng cho Stores/Coupons/Categories/Events/Reviews/Submissions/Newsletter (một số bảng phải tách thành Client Component riêng: `CategoryTable`, `EventTable`, `ReviewTable`, `SubmissionTable`, `NewsletterTable`).

### Bảng Store (`components/admin/StoreTable.tsx`)

- Logo 32px → 44px.
- Thêm cột **Status** (`Store.isActive`, migration mới) quyết định hiển thị công khai — tắt thì ẩn khỏi `/stores`, category, search, sitemap và trang chi tiết trả 404 (`getStores()` lọc active, `getAllStores()` không lọc dùng cho admin).
- Thêm cột **Event** (dựa vào `EventStore` qua `setStoreEvent()` mới trong `lib/data/events.ts`, 1 store chỉ thuộc 1 event, mặc định "Uncategorized").
- Thêm cột **Date** (`createdAt`).
- Event/Featured/Status chuyển thành dropdown (`components/admin/AdminDropdownSelect.tsx`), độ rộng cố định từng cột (w-32/w-28/w-20).
- Thêm bộ lọc Event/Featured/Status cạnh ô search.
- API `app/api/admin/stores/[id]/route.ts` PATCH nhận thêm `isActive`, `eventId`.

### Form Store (`components/admin/StoreForm.tsx`)

- Bỏ Region/Rating/RatingCount khỏi form — tạo mới: `rating=5`, `ratingCount` random 1-1000, `region="GLOBAL"`; sửa: giữ nguyên giá trị cũ.
- Category: đổi từ multi-select checkbox sang **single-select** (`components/admin/SingleSelectDropdown.tsx`, cuộn ~15 item, khoá cuộn trang khi mở dropdown bằng cách khoá `overflow` của `<main>`, không phải `document.body`).
- Trường bắt buộc: Name, Slug (tự slugify từ Name), Logo, Website (validate URL), Affiliate Link (validate URL), Category, About Store.
- Layout 80% width căn giữa; nút Back (trái, có dialog xác nhận khi `isDirty`) + Create/Update Store (phải, dưới cùng).
- Schema mới trong `prisma/schema.prisma`: `Store.aboutStore`, `Store.howToApply` (migration đã chạy).

### Upload ảnh (Logo/Banner)

- `components/admin/ImageUploadField.tsx`: dropdown "Storage" (Cloudinary mặc định / Supabase Storage), nút Upload/Replace, preview.
- `app/api/admin/upload/route.ts` + `lib/server/storage/{cloudinaryStorage,supabaseStorage}.ts`: validate MIME/size, upload theo provider, báo lỗi rõ nếu thiếu env var.
- `next.config.ts`: `images.remotePatterns` + CSP `img-src` cho `*.supabase.co` và `res.cloudinary.com`.
- Env đã điền trong `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`.

### Rich text editor (Description/About Store/How To Apply)

- `components/admin/RichTextEditor.tsx` (TipTap): heading (Normal/H1-H4), font size (Extension tự viết), bold/italic/underline/strike, highlight + đổi màu highlight, đổi màu chữ, sub/superscript, clear formatting, list/quote/hr, align, bảng (insert/add row/col/delete), undo/redo.
- Chèn ảnh nâng cao: `components/admin/ImageInsertModal.tsx` — bắt buộc Alt Text, Width/Height khoá tỉ lệ; ảnh chỉ preview local (`blob:`) lúc soạn, **upload thật lên Cloudinary dạng `.webp` khi bấm Create/Update Store** (`lib/richTextImageUpload.ts`: `registerPendingImage()` + `resolveRichTextImages()`).
- Link: `components/admin/LinkModal.tsx` (dialog giữa màn hình, thay `window.prompt`).
- CSS bổ sung trong `app/globals.css` (`.rich-text-content`) cho list/quote/heading/hr/mark/table/img (Tailwind preflight xoá style mặc định).
- Public render: `components/ui/RichHtml.tsx` (sanitize bằng `isomorphic-dompurify`) dùng ở `StoreHeader`, trang `/store/[slug]` (About/How to apply); `stripHtml()` (`lib/utils.ts`) dùng cho blurb ngắn (StoreCard, sidebar coupon).

### FAQs

- Nút "Paste FAQs" mở modal dán Q&A hàng loạt (`components/admin/FaqPasteModal.tsx`, parser `lib/parseFaqPaste.ts` nhận dạng `Q:/A:` hoặc khối cách dòng trống).
- Dán nhiều lần **cộng dồn** (không ghi đè) — `faqArray.append()`.
- Dialog rộng gấp 1.5 lần mặc định (`max-w-3xl`).

### Form Coupon/BlogPost/Event (thêm sau, cùng ngày 2026-07-03)

Trước đó 3 entity này chỉ có toggle (Featured/Verified) + Delete trong bảng, không có form tạo/sửa. Đã bổ sung đầy đủ theo đúng pattern của `StoreForm`/`CategoryForm`:

- **Coupon** (`components/admin/CouponForm.tsx`, `lib/validators/admin/coupon.ts`, `createCoupon`/`updateCoupon` trong `lib/data/coupons.ts`): chọn Store, title→slug tự động, description/terms là textarea thường (không rich text — trang `/coupon/[slug]` render plain text), type/discountType/discountValue/currency, affiliateUrl (validate URL), startsAt/expiresAt (`type="date"`), exclusive/isFeatured/isTrending checkbox. Route `app/admin/coupons/new`, `app/admin/coupons/[id]`; API PATCH `[id]/route.ts` hỗ trợ song song full-schema update và toggle đơn lẻ (isFeatured/verified) như Store.
- **BlogPost** (`components/admin/BlogForm.tsx`, `lib/validators/admin/blog.ts`, `createBlogPost`/`updateBlogPost`, `getBlogAuthors()`/`getBlogPostById()` mới trong `lib/data/blog.ts`): coverImage qua `ImageUploadField`, author chọn từ `BlogAuthor` có sẵn (chưa có UI tạo author mới), category optional, tags nhập dạng chuỗi phân cách bởi dấu phẩy (parse thành `string[]` khi submit), **body là textarea thường theo quy ước `## Heading` + dòng trống** (không dùng TipTap — khác với Store, vì `parseBlogSections()` trong `lib/blog.ts` parse markdown-lite, không phải HTML).
- **Event** (`components/admin/EventForm.tsx`, `lib/validators/admin/event.ts`, `createEvent`/`updateEvent`/`getEventById()` mới trong `lib/data/events.ts`): name→slug tự động, iconName (text nhập tay, giống Category), description, bannerUrl qua `ImageUploadField` (optional), startsAt/endsAt.
- Cả 3 bảng (`CouponTable`, `BlogTable`, `EventTable`) đã thêm cột Actions có link Edit (Pencil icon) trỏ tới `/admin/{coupons|blog|events}/[id]`, và trang danh sách có nút "Add ..." góc phải giống Stores/Categories.
- Lưu ý kỹ thuật: `discountValue`/`readingMinutes` dùng `z.number()` (không phải `z.coerce.number()`) + `register(field, { valueAsNumber: true })` — `z.coerce.number()` gây lỗi type giữa input (string) và output (number) khi kết hợp `useForm<T>` + `zodResolver` trong phiên bản zod/react-hook-form hiện tại của repo.

### Quản lý Store/Coupon cho 1 Event (chiều ngược lại, thêm sau)

Trước đó chỉ có chiều Store → chọn Event (`setStoreEvent()`, dropdown trong `StoreForm`/`StoreTable`). Đã bổ sung chiều Event → chọn nhiều Store/Coupon:

- `components/admin/MultiSelectDropdown.tsx` mới — clone `SingleSelectDropdown` nhưng `values: string[]` + checkbox mỗi dòng, label nút hiển thị các item đã chọn nối bằng dấu phẩy. Cùng hành vi khoá scroll `<main>` và click-outside như bản single-select.
- `adminEventSchema` thêm `featuredStoreIds`/`featuredCouponIds: z.array(z.string())`.
- `lib/data/events.ts` thêm:
  - `setEventStores(eventId, storeIds)` — diff danh sách cũ/mới rồi gọi lại `setStoreEvent()` có sẵn cho từng store (thêm gọi `setStoreEvent(id, eventId)`, bớt gọi `setStoreEvent(id, null)`) để **giữ đúng invariant "1 store chỉ thuộc 1 event"** dù thao tác từ phía Event hay phía Store đều ra cùng kết quả.
  - `setEventCoupons(eventId, couponIds)` — coupon **không** bị giới hạn 1-event-1-coupon (khác store), chỉ replace toàn bộ `EventCoupon` của event đó bằng transaction `deleteMany` + `createMany`.
- API `app/api/admin/events/route.ts` (POST) và `[id]/route.ts` (PATCH) gọi `setEventStores`/`setEventCoupons` song song sau khi `createEvent`/`updateEvent`, rồi refetch bằng `getEventById()` để trả về state mới nhất (bản ghi trả về ngay sau `updateEvent`/`createEvent` chưa có association mới).
- `EventForm` nhận thêm props `stores`/`coupons`, render 2 `MultiSelectDropdown` ("Featured Stores" có ghi chú invariant, "Featured Coupons" hiển thị label `"{Store name} — {Coupon title}"`). `app/admin/events/new|[id]/page.tsx` fetch thêm `getAllStores()` + `getCoupons()`.
- `EventTable` thêm 2 cột đếm nhanh **Stores**/**Coupons** (`event.featuredStoreIds.length` / `featuredCouponIds.length`) để thấy ngay kết quả gán mà không cần mở form.
- ⚠️ Lưu ý dữ liệu seed cũ: `data/events.json` seed một store vào **nhiều** event cùng lúc trực tiếp qua Prisma (bỏ qua invariant, vd `store_nike` thuộc cả Father's Day lẫn Christmas) — đây là vi phạm invariant có từ trước, chỉ UI mới enforce 1-event-per-store từ nay trở đi. Nếu chỉnh sửa Event có chứa store này qua form mới, `setEventStores` sẽ tự động thu gọn store đó về đúng 1 event (event đang sửa), xoá liên kết cũ — cần lưu ý nếu muốn giữ nguyên seed data nhiều event cho 1 store.

### Rate-limit cho `/api/admin/upload` (thêm sau)

- Thêm `uploadRateLimit = createLimiter(20, "1 m")` trong `lib/server/cache/rateLimit.ts` — mức 20/phút không theo spec CLAUDE.md (route này không có trong danh sách), chọn để chặn _vòng lặp lỗi của admin_ làm tốn quota Cloudinary/Supabase, **không phải** chống abuse công khai (route đã được `proxy.ts` chặn bằng NextAuth trước khi tới đây).
- `app/api/admin/upload/route.ts`: gọi `auth()` lấy session, dùng `session.user.email` làm định danh rate-limit (không dùng IP như các route công khai khác, vì route này luôn có người đăng nhập) — fallback về `getClientIp()` nếu vì lý do gì đó thiếu session/email (không 401 lại, vì middleware đã đảm bảo có auth rồi). Check đặt ở đầu `POST`, trước khi parse `formData()`.
- Local dev chưa cấu hình `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (rỗng trong `.env`) nên `uploadRateLimit` = `null`, mọi request vẫn cho qua — đã test 5 lần upload liên tiếp qua Playwright thật, đều `200`, không gãy hành vi cũ.

### Bảng Coupon (`components/admin/CouponTable.tsx`, thêm sau)

Áp dụng đúng pattern đã làm cho `StoreTable` (Status + dropdown):

- Thêm `Coupon.isActive` (Boolean, `@default(true)`) vào `prisma/schema.prisma` (migration `20260703145600_coupon_is_active`) — coupon tắt Status thì ẩn khỏi mọi nơi công khai (home, search, categories, deals, sitemap, `/coupon/[slug]` trả 404) giống hệt cơ chế `Store.isActive`.
- `lib/data/coupons.ts`: tách `getAllCouponsCached` (unstable_cache nội bộ, không filter) → `getAllCoupons()` (không filter, dùng cho admin) và `getCoupons()` (filter `isActive`, dùng cho public — mọi hàm khác như `getFeaturedCoupons`, `filterCoupons`, `getRelatedCoupons`... tự động kế thừa filter vì đều gọi qua `getCoupons()`). `getCouponBySlug()` filter thêm `isActive`. `getCouponById()` **giữ nguyên không filter** (dùng cho admin edit form + redirect `/go/[couponId]`) — y hệt lý do `getStoreById` không filter. Thêm `setCouponActive(id, isActive)`.
- API: `app/api/admin/coupons/route.ts` GET đổi sang `getAllCoupons()`; `[id]/route.ts` PATCH thêm nhánh `isActive`. Trang `app/admin/coupons/page.tsx` và `app/admin/events/new|[id]/page.tsx` (phần chọn Featured Coupons) cũng đổi sang `getAllCoupons()` để admin thấy cả coupon đang ẩn.
- `CouponTable`: thêm cột **Status** ngay sau **Featured**, **Date** cuối cùng (trước Actions) — thứ tự: Store, Title, Type, Featured, Status, Verified, Date, Actions. Cột Featured/Status/Verified đổi từ `ToggleButton` (click 1 phát đổi luôn) sang `AdminDropdownSelect` (click mở dropdown chọn), mỗi cột có `triggerClassName` cố định (Featured/Verified `w-28`, Status `w-20`, giống hệt width dùng ở `StoreTable`) để các nút trong cùng 1 cột luôn thẳng hàng bất kể độ dài label.
- Bộ lọc cạnh ô search (giống pattern `StoreTable`): **Store**, **Featured**, **Status**, **Verified** (đều `all`/`true`/`false`) — filter kết hợp AND với search text trong cùng 1 `useMemo`. Filter **Store** dùng `SingleSelectDropdown` (thay vì `<select>` thường như Featured/Status/Verified) vì danh sách store có thể rất dài.
- `SingleSelectDropdown` được bổ sung 2 prop optional mới: `searchable` + `searchPlaceholder` — bật thì hiện ô tìm kiếm cố định phía trên danh sách option (danh sách bên dưới lọc theo label, có thể cuộn riêng), tắt (mặc định) thì giữ nguyên hành vi cũ, không ảnh hưởng các chỗ đang dùng (`StoreForm` category select). Reset ô tìm kiếm mỗi lần đóng dropdown qua hàm `closeDropdown()` dùng chung (không đặt trong `useEffect` để tránh lỗi lint `set-state-in-effect`).
- ⚠️ Phát hiện khi test: sau khi `npx prisma migrate dev` xong, dev server **đang chạy từ trước** vẫn trả field mới là `undefined` dù đã restart process — nguyên nhân là cache đĩa Turbopack (`.next/cache`) giữ bản compile cũ của `lib/data/coupons.ts`, không phải do code sai (`npm run typecheck`/`build` luôn sạch vì chạy compile mới hoàn toàn). Cách khắc phục: `rm -rf .next` rồi khởi động lại `npm run dev`. **Ghi nhớ cho lần sau**: sau khi đổi Prisma schema, nếu dev server đang chạy vẫn thiếu field mới sau restart bình thường, phải xoá `.next` chứ không chỉ restart process.
- Đã test thật bằng Playwright: bảng hiển thị đúng thứ tự cột + màu badge (Active xanh/Hidden đỏ), đổi Status Active↔Hidden qua dropdown → trang `/coupon/[slug]` 404 khi Hidden, biến mất khỏi `/api/coupons` công khai, khôi phục lại Active thì trả 200 bình thường trở lại; cả 4 filter (Store/Featured/Status/Verified) test riêng từng cái đều lọc đúng.
- Logo store trong bảng tăng từ `h-6 w-6` (24px) → `h-8 w-8` (32px).
- Thêm **bulk-select** cho `CouponTable`: nút "Select Items" (icon `ListChecks`) dưới hàng filter, bấm lần 1 bật `selectionMode` (thêm cột checkbox đầu mỗi hàng trong `paged`, hiện thêm nút "Select All" cạnh đó), bấm lần 2 tắt và tự xoá hết lựa chọn (`toggleSelectionMode` luôn reset `selectedIds` — an toàn vì lúc bật thì set đang rỗng sẵn). Nút "Select All" toggle theo `allPagedSelected` (dựa vào `paged` — tức trang hiện tại, không phải toàn bộ danh sách đã lọc) → đổi label "Deselect all" khi đã chọn hết trang đó; bỏ tick 1 item thì tự động quay lại label "Select All". `selectedIds` là `Set<string>` giữ nguyên qua các lần đổi trang (không bị mất khi chuyển trang). Nút "Delete (N)" xuất hiện góc phải cùng hàng bất cứ khi nào `selectedIds.size > 0` (không chỉ riêng sau khi bấm Select All) — bấm vào `window.confirm()` (giống `DeleteButton` không dùng Modal riêng) rồi `Promise.all` gọi `DELETE /api/admin/coupons/{id}` cho từng id, xong thì tự thoát `selectionMode` + `router.refresh()`.
- Đã test thật: bật/tắt selection mode, Select All ↔ Deselect all khi bỏ tick 1 item, và bulk-delete thật (tạo 2 coupon rác qua API → chọn hết → Delete (2) → xác nhận dialog → bảng về "No coupons found" cho search đó, tự thoát selection mode) — không có console error.

### Slug tự động đồng bộ theo Name (thêm sau, phiên 2026-07-06)

- Bug cũ: `slugTouched` trong `StoreForm.tsx` là cờ một chiều (`false → true`, không bao giờ reset) — sau khi người dùng chạm vào ô Slug một lần (kể cả gõ rồi xoá), Name không còn tự sinh Slug nữa dù sửa Name tiếp bao nhiêu lần.
- Fix: xoá cờ `slugTouched`, đổi điều kiện Name's `onChange` thành `if (!store) setValue("slug", slugify(...))` — khi **tạo mới** (`store` undefined), mọi lần gõ Name đều ghi đè Slug vô điều kiện (Slug chỉ là preview tạm, không có khoá thật); khi **sửa store đã tồn tại**, Name không bao giờ tự đổi Slug (giữ nguyên an toàn, tránh vỡ URL/SEO công khai) — đã xác nhận với người dùng, có cân nhắc giữa 2 lựa chọn.

### Rich text editor — giới hạn chiều cao khi gõ Enter

- Thêm prop `maxHeightClassName` (song song `minHeightClassName` đã có) cho `RichTextEditor`, cộng thêm `overflow-y-auto` vào class editor — nội dung vượt quá chiều cao tối đa thì cuộn nội bộ thay vì đẩy cả trang dài ra. `StoreForm.tsx` truyền riêng cho từng field (~2x min-height hiện tại): Description `max-h-40`, About Store `max-h-[28rem]` (arbitrary value, Tailwind không có bước mặc định), How To Apply `max-h-80`.

### Redesign dialog "Insert/Edit image" (`ImageInsertModal.tsx`, nhiều vòng lặp cùng phiên)

Tổng hợp toàn bộ các lần chỉnh sửa dialog chèn/sửa ảnh trong rich text editor (Description/About Store/How To Apply), từ bản gốc (chỉ có Alt Text bắt buộc + Width/Height khoá tỉ lệ + upload-only) tới bản hiện tại:

- **Alt Text** hết bắt buộc — để trống thì mặc định `"Product image"` (áp dụng cả lúc chèn mới lẫn sửa).
- **Paste ảnh trực tiếp** (Ctrl+V) vào ô soạn thảo — `RichTextEditor.tsx`'s `editorProps.handlePaste`, dùng `view.dispatch` cấp thấp (không phải `editor.chain()`) vì việc đo kích thước ảnh là async.
- **Double-click 1 ảnh đã chèn** để mở lại dialog sửa (`handleDOMEvents.dblclick`) — dò vị trí node bằng `posAtDOM` + `nodeBefore`/`nodeAfter` + cross-check `nodeDOM(pos) === target` (ảnh là atom node, `posAtDOM` có thể lệch tuỳ điểm click). `ImageInsertModal` nhận thêm prop `editingImage` (`{pos, attrs}`), pre-fill qua lazy `useState(() => ...)` — **không dùng `useEffect`** (tránh lỗi lint `set-state-in-effect`), thay vào đó parent (`RichTextEditor`) remount modal bằng `key={imageModalSession}` tăng dần mỗi lần mở, buộc state khởi tạo lại đúng từ `editingImage` mới.
- **Nút "Max Width"** — ảnh full-width responsive theo cột bài viết. Attribute mới `data-full-width` trên `CustomImage`, CSS `.rich-text-content img[data-full-width="true"] { width:100%; height:auto; float:none!important; ... }`. Ban đầu chỉ bật một chiều, sau sửa thành **toggle thật** (`handleEnterMaxWidth`/`handleExitMaxWidth`) — tắt đi thì tự tính lại Width/Height theo kích thước ảnh gốc (không để trống).
- **Redesign kiểu TinyMCE** (tham khảo ảnh mẫu do người dùng cung cấp) — thêm **Border (px)**, **Horizontal/Vertical spacing (px)**, **Position** (None/Left/Center/Right):
  - File mới `lib/richTextImageStyle.ts`: `borderStyleProps`/`hspaceStyleProps`/`vspaceStyleProps`/`styleObjectToCss` — nguồn xử lý style dùng chung cho cả TipTap attribute `renderHTML` (cần chuỗi CSS) và preview trong modal (cần object React style).
  - `CustomImage.addAttributes()` thêm `"data-position"` (attribute thuần, round-trip tự động, hiệu ứng float/center qua CSS attribute-selector vì chỉ 3 giá trị cố định) và `borderWidth`/`hspace`/`vspace` (render thành `style`, mỗi cái có `parseHTML` riêng đọc lại từ `element.style.*`) — đã xác minh trực tiếp trong `node_modules/@tiptap/core` rằng `mergeAttributes` gộp `style` theo **từng CSS property** (không ghi đè cả chuỗi) nên nhiều attribute độc lập cộng dồn vào `style` cuối cùng mà không đá nhau.
  - `hspace` vô hiệu khi Position = Center (margin cố định phá vỡ `margin:auto` để center) và khi Max Width bật — disable input + hint text, đồng thời `handleConfirm` ép null độc lập với UI.
  - Dialog dùng layout 2 cột (`max-w-4xl`): cột trái là toàn bộ field, cột phải là **live preview** — đoạn text mẫu bọc quanh `<img>` preview thật (native `<img>`, không dùng `next/image` vì cần float/margin/border thật), nằm trong wrapper `.rich-text-content` để ăn đúng CSS production, không lặp logic.
  - Đã xác minh `RichHtml.tsx` (DOMPurify mặc định) giữ nguyên `style`/`data-*` nên style Border/spacing/Position hiển thị đúng trên trang public.
- **URL giờ là ô nhập thật** (trước đó `readOnly disabled` chỉ hiển thị) — dán link ảnh ngoài (Google/Facebook/...) hiển thị trực tiếp, không upload Cloudinary (không gắn `data-upload-id`/`data-pending-upload`). "Upload Image" tách xuống dòng riêng (trước chung hàng với URL). Width/Height cũng tách thành 2 dòng riêng full-width (trước chung 1 hàng với nút khoá tỉ lệ + Max Width, bị bó hẹp).
  - **CSP `img-src`** (`next.config.ts`) phải nới từ danh sách cố định (chỉ Supabase/Cloudinary) sang `'self' data: blob: https:` (mọi domain https) — nếu không, ảnh dán link ngoài bị trình duyệt chặn hiển thị âm thầm. Đây là thay đổi nới lỏng bảo mật áp dụng toàn site, đã hỏi và được người dùng xác nhận trước khi làm.
  - Sửa ảnh (double-click) mà tự đổi sang URL khác (không chọn file mới) → set `src` mới + xoá `data-upload-id`/`data-pending-upload` cũ (nếu ảnh gốc từng pending) để không treo tham chiếu tới file không còn khớp.
- **Alt Text/Width/Height không tự điền khi mở form sửa** (bug) — ảnh không có Width/Height tường minh (vd chèn qua URL không gõ kích thước) thì mở form sửa vẫn để trống dù ảnh hiển thị đúng kích thước thật. Fix: `onLoad` trên `<img>` preview, nếu Width/Height đang trống thì tự điền theo kích thước gốc (cùng công thức `min(naturalWidth, 480)` lúc chọn ảnh lần đầu) — áp dụng cả lúc chèn mới lẫn sửa.

### Ảnh trong editor chính: trạng thái chọn / nhiều ảnh 1 hàng / bug chọn-ghi-đè

- **Click chọn ảnh có phản hồi hình ảnh** — ProseMirror tự gắn class `ProseMirror-selectednode` khi ảnh được `NodeSelection` (click 1 phát) nhưng trước đó không có CSS nào cho class này. Thêm `.rich-text-content img.ProseMirror-selectednode { outline: 2px solid var(--brand-500); outline-offset: 2px; }`.
- **Nhiều ảnh chèn liên tiếp (không Enter) nằm cùng 1 hàng, tự wrap khi hết chỗ** (giống ảnh mẫu tham khảo) — 2 lớp nguyên nhân phải sửa cùng lúc:
  1. `@tiptap/extension-image` mặc định `inline: false` (node **block**, luôn xuống dòng riêng) — đổi `CustomImage.configure({ inline: true })`.
  2. Riêng vậy chưa đủ: Tailwind preflight đặt `img { display: block }` toàn cục, ghi đè mất hiệu lực — phải thêm `display: inline-block` riêng trong `.rich-text-content img`.
- **Bug chọn-ảnh-rồi-ghi-đè**: sau khi 1 ảnh được `NodeSelection` (do click đơn hoặc do `replaceSelectionWith` lúc paste/double-click-sửa để lại), nếu sau đó chèn ảnh khác qua toolbar/paste mà KHÔNG di chuyển selection trước, lệnh insert sẽ **thay thế** ảnh đang chọn thay vì chèn thêm — xảy ra ở 2 chỗ:
  - Paste liên tiếp 2 ảnh: `handlePaste` dùng `replaceSelectionWith` để lại NodeSelection ngay trên ảnh vừa chèn → sửa để dời selection thành `TextSelection` ngay sau ảnh (`TextSelection.near`) sau mỗi lần chèn.
  - Double-click sửa 1 ảnh rồi Cancel/Save xong chèn ảnh khác ở toolbar: ảnh vừa sửa vẫn là NodeSelection còn sót lại từ cú click đơn trước đó → sửa cả ở `handleDOMEvents.dblclick` (dời selection ngay khi mở dialog sửa) và ở `ImageInsertModal.handleConfirm` (dời lại selection sau `updateAttributes` vì `setNodeSelection` trước đó tái lập NodeSelection để áp update).

### Validate trùng lặp Slug (thêm sau)

- Phát hiện Category/Coupon/BlogTopic đã có sẵn pattern xử lý trùng slug (`throwIfSlugConflict` bắt Prisma `P2002` có `meta.target` chứa `"slug"` → ném `Error("SLUG_TAKEN")`; route API bắt message này → `jsonError(409, "This slug is already in use...")`; form `setError("slug", {message})` nếu response error chứa từ "slug") nhưng **Store bị bỏ sót** — trùng slug trước đây crash 500 chung chung, chỉ hiện toast mơ hồ.
- Áp dụng nguyên pattern trên cho `lib/data/stores.ts` (`createStore`/`updateStore` bọc try/catch), `app/api/admin/stores/route.ts` + `[id]/route.ts`, và `StoreForm.tsx` (`setError` vào destructure `useForm`).

### Paste ảnh copy từ trang web: lấy đúng URL gốc + Alt text thật (thêm sau)

- Bug: khi "Copy image" (copy dữ liệu nhị phân) từ 1 trang web rồi dán vào editor, `handlePaste` cũ chỉ đọc `clipboardData.items` tìm mục `image/*`, luôn tạo `blob:` cục bộ + Alt mặc định "Product image" — mất URL gốc thật lẫn Alt text thật của trang nguồn.
- Nguyên nhân/fix: trình duyệt khi copy ảnh từ 1 trang web thường **đồng thời** đặt vào clipboard 1 bản `text/html` chứa đúng thẻ `<img src="URL gốc" alt="mô tả thật (nếu có)">`. Sửa `handlePaste` để **ưu tiên đọc `text/html` trước** — nếu tìm được `<img src>` là URL tuyệt đối (`http(s)://...`), dùng thẳng URL đó + Alt thật (không tạo blob, không gắn `data-upload-id`/`data-pending-upload`, khớp đúng quy tắc "ảnh URL không upload Cloudinary"); nếu không có `text/html` hợp lệ (vd dán screenshot chụp màn hình thật) thì rơi về đúng logic `image/*` binary cũ, không đổi.
- Trường hợp gõ/dán URL trần trực tiếp vào ô URL của dialog (không phải copy-paste ảnh) vẫn giữ nguyên Alt mặc định "Product image" — đã hỏi và người dùng xác nhận **không cần** thêm tính năng fetch trang nguồn để dò alt text thật (web-scraping riêng, phức tạp/không ổn định), giữ nguyên hành vi đơn giản.

### Store mới tạo lên đầu bảng + bulk-select cho StoreTable (thêm sau)

- `lib/data/stores.ts`: thêm `orderBy: { createdAt: "desc" }` vào `prisma.store.findMany()` trong `getAllStoresCached` (trước đây không có `orderBy`, thứ tự trả về không xác định) — đúng chỗ và đúng cách `getAllCouponsCached` đã làm (áp dụng ngay tại query cache dùng chung cho cả `getAllStores()` admin lẫn `getStores()` public, nên `/stores` cũng nhận thứ tự mới nhất trước, nhất quán với Coupon).
- `components/admin/StoreTable.tsx`: đọc `admin-ui-coupon.md` lấy nguyên pattern **bulk-select** đã có ở `CouponTable.tsx` áp dụng cho Store — nút "Select Items" (icon `ListChecks`) bật/tắt `selectionMode` (thêm cột checkbox đầu mỗi hàng trong `paged`), nút "Select All"/"Deselect all" theo `allPagedSelected` (dựa vào trang hiện tại), nút "Delete (N)" xuất hiện khi `selectedIds.size > 0`, xác nhận qua `Modal` (không phải `window.confirm`), bulk-delete bằng `Promise.all` gọi `DELETE /api/admin/stores/{id}` cho từng id, xong tự thoát `selectionMode` + `router.refresh()`.
- Đã test thật bằng Playwright: tạo 2 store thật liên tiếp → xác nhận store tạo sau luôn nhảy lên đầu bảng (không phải cuối); bật Select Items, tick/bỏ tick cập nhật đúng số trên nút Delete (N), bulk-delete thật 2 store test → xoá đúng cả 2, tự thoát selection mode — không có console error.

### Xóa Store dọn sạch dữ liệu liên quan + Status Store cascade sang Coupon (thêm sau, phiên 2026-07-06)

- **Xóa Store**: `Coupon`/`Review` của store đã có `onDelete: Cascade` sẵn trong schema (Prisma tự xóa ở tầng DB khi `prisma.store.delete`) — không cần thêm validate chặn xóa (khác `deleteEvent` có guard `EVENT_IN_USE`), đúng ý muốn "xóa store thì xóa sạch mọi thứ liên quan". Nhưng 2 chỗ không phải FK thật nên cascade DB không tự dọn: `deleteStore()` (`lib/data/stores.ts`) sửa để trước khi xóa, lấy `{id, slug}` của các coupon thuộc store; sau khi xóa xong thì purge cache tag `coupons:list` + từng `coupon:<slug>` (trước đây các coupon bị cascade xóa "câm lặng", không purge tag riêng, `/coupon/[slug]` có thể trả dữ liệu cũ tới hết `revalidate: 300`), và quét `Event.couponId` (mảng `String[]` tự quản lý, không phải quan hệ FK) để lọc bỏ id coupon vừa mất khỏi mọi event từng chứa nó, purge `event:<slug>` tương ứng.
- **Status Store cascade sang Coupon**: `setStoreActive()` (`lib/data/stores.ts`) sau khi update `Store.isActive` giờ tính thêm danh sách coupon bị ảnh hưởng — tắt (`isActive=false`) thì lấy toàn bộ coupon của store; bật (`isActive=true`) thì chỉ lấy coupon còn hạn (`expiresAt` null HOẶC `expiresAt >= now`, cùng ngữ nghĩa với `isExpired()` ở `lib/utils.ts`) — rồi `updateMany` set `isActive` tương ứng + purge cache tag từng coupon. Khi bật lại, gọi thêm `syncCouponWithStoreEvent()` (sẵn có trong `lib/data/events.ts`, import thẳng vào `stores.ts` không bị vòng lặp vì `events.ts` không import ngược `stores.ts`) cho từng coupon `exclusive` vừa bật, giữ đúng invariant "coupon exclusive+active phải nằm trong `Event.couponId`" vốn đã áp dụng khi bật từng coupon lẻ qua `setCouponActive`.
- Đã hỏi và người dùng xác nhận: khi Active lại store, bật lại **tất cả** coupon còn hạn, không cần phân biệt coupon từng bị admin tắt tay trước đó với coupon bị tắt do cascade từ store (phương án đơn giản, không thêm migration/field mới).
- Đã test thật qua API (login admin thật bằng `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, không qua UI vì không có Playwright/browser sẵn trong phiên này): tạo 1 store + 2 coupon (1 hết hạn 2020, 1 không có `expiresAt`) → set Store Status Hidden → cả 2 coupon đổi `isActive=false`, `/api/coupons/[slug]` cả 2 đều 404 ngay lập tức (không cần đợi cache hết hạn) → set lại Active → chỉ coupon còn hạn quay lại `isActive=true`, coupon hết hạn giữ `false`. Test xóa store: gán 1 coupon exclusive của store vào `Event.couponId` của 1 event test, xóa store → coupon biến mất khỏi `/api/admin/coupons`, `/api/coupons/[slug]` trả 404 ngay, và `Event.couponId` tự động lọc bỏ đúng id coupon đó (event vẫn còn, chỉ mất đúng 1 phần tử trong mảng). Dọn sạch store/coupon/event test sau khi xong. `npm run typecheck`/`npm run lint` sạch (chỉ còn 1 warning cũ không liên quan).
- Lưu ý phụ (không liên quan trực tiếp, phát hiện khi test): `POST /api/admin/events` với `featuredStoreIds` không phải rỗng — response trả về `featuredStoreIds: []` thay vì đúng danh sách đã gửi (đã kiểm tra lại bằng GET riêng, không phải do cache) — có vẻ là bug có từ trước ở chiều "tạo Event kèm gán Store ngay khi tạo", chưa sửa vì ngoài phạm vi yêu cầu lần này, chỉ ghi lại để lưu ý cho lần sau.

## 3. Trạng thái hiện tại

- Dev server chạy ổn định tại `http://localhost:3000`. `npm run typecheck`, `npm run lint` (chỉ 1 warning cũ không liên quan ở `lib/server/affiliate/redirect.ts`), `npm run build` đều sạch.
- Đã test end-to-end bằng Playwright thực tế cho toàn bộ tính năng trên: pagination, dropdown Event/Featured/Status, form validate, upload ảnh (cả 2 provider), toolbar rich text (heading/font-size/color/highlight/table/link modal), chèn ảnh → submit → upload Cloudinary webp thật, paste FAQ cộng dồn.
- Form Coupon/BlogPost/Event mới cũng đã test end-to-end bằng Playwright thật (login admin thật, tạo → xuất hiện trong bảng → mở lại form Edit đúng dữ liệu → xoá dọn dẹp), kể cả upload ảnh thật lên Cloudinary cho BlogPost. Không có console/page error nào phát sinh; số lượng coupon/blog/event trở về đúng baseline sau khi xoá dữ liệu test.
- Multi-select Store/Coupon cho Event cũng đã test thật: tạo event mới, chọn 2 store + 1 coupon → bảng hiện đúng số lượng → mở lại form Edit thấy đúng lựa chọn đã lưu → StoreTable xác nhận 2 store đó đổi Event tương ứng (đúng invariant) → xoá event test. Trong lúc test đã vô tình xoá mất 2 liên kết seed gốc của `store_nike` (Father's Day + Christmas) do gọi `setStoreEvent` trực tiếp; đã chạy lại `npm run db:seed` (idempotent, chỉ upsert, không xoá gì) để khôi phục — đã xác nhận lại bằng query Prisma trực tiếp rằng 2 liên kết đã về đúng như seed gốc.
- Xoá Store + cascade Status Store→Coupon (mục ngay trên) đã test thật qua API thật (không qua Playwright UI, phiên này không có sẵn browser) và xác nhận đúng hành vi; dữ liệu test đã dọn sạch, không còn store/coupon/event rác trong DB.
- Bug tồn đọng đã biết, chưa sửa (ngoài phạm vi yêu cầu các phiên trước, chỉ ghi nhận): `POST /api/admin/events` không gán đúng `featuredStoreIds` lúc **tạo mới** — response (và GET lại ngay sau đó) trả về `featuredStoreIds: []` dù đã gửi kèm store id lúc tạo; cần soát lại `app/api/admin/events/route.ts` (POST) xem có gọi `setEventStores` đúng thứ tự với `createEvent` hay không.

## 4. Bước tiếp theo

- Soát lại bug `POST /api/admin/events` không gán đúng `featuredStoreIds` lúc tạo mới (xem mục "Bug tồn đọng đã biết" ở trên).
