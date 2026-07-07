# Admin UI — Event & Blog — Session Summary — 2026-07-06

## 1. Mục tiêu

Hoàn thiện admin CRUD cho Event (form, danh sách, Featured Coupons) và Blog (form, danh sách, Topics mới, sidebar submenu).

## 2. Những phần đã hoàn thành

**Event admin — danh sách (`EventTable.tsx`, `app/admin/events/page.tsx`)**
- Thêm ô search theo tên, cột Icon (trước Name), cột Banner (sau Name).
- Cột Coupons đổi thành `featuredCouponIds.length` (tổng coupon đã curate cho event, không phải riêng số exclusive).
- Chặn xoá event còn store gán vào (`deleteEvent` → `EVENT_IN_USE` → 409), mirror pattern `CATEGORY_IN_USE`.
- Event mới tạo lên đầu danh sách admin (sort riêng theo `createdAt desc` tại `app/admin/events/page.tsx`, không đụng `getEvents()` dùng chung cho trang public).

**Event admin — form (`EventForm.tsx`, `lib/data/events.ts`, `lib/validators/admin/event.ts`, `prisma/schema.prisma`)**
- Fix bug đồng bộ Slug: bỏ cờ `slugTouched` một chiều, Name đổi → Slug luôn resync (chỉ khi tạo mới).
- Thêm `iconImageUrl` cho Event (migration `20260705081217_event_icon_image_optional_dates`), Icon name chuyển sang dropdown chọn từ `iconMap`, ưu tiên hiển thị qua `renderCategoryIcon()`.
- Banner + Icon image dùng `deferUpload` — chỉ upload Cloudinary lúc bấm Create/Update Event.
- `startsAt`/`endsAt` chuyển thành optional (cùng migration).
- Bỏ hẳn field "Featured Stores" khỏi form (gán store↔event vẫn làm được qua `StoreForm`'s Event picker, gọi `setStoreEvent` độc lập).
- Featured Coupons: chỉ hiện khi sửa event đã có store; UI 2 dropdown (`ScrollableSingleSelectDropdown` lọc theo store + `ScrollableMultiSelectDropdown` mới tạo chọn coupon, không khoá scroll trang) + danh sách coupon đã chọn hiển thị riêng bên dưới.
- Chỉ lấy coupon `isActive=true` (đổi `getAllCoupons()` → `getCoupons()` ở 2 trang new/[id]).
- `setStoreEvent()` tự động seed coupon `exclusive && isActive` của store vào `Event.couponId` khi store gia nhập event.
- Fix bug P2011 (tạo event mới lỗi "Failed to save event.") — `createEvent()` thiếu `couponId: []` tường minh do cột DB mất default (drift cũ).
- `lib/data/events.ts` thêm `syncCouponWithStoreEvent()` (dùng chung helper `unionCouponsIntoEvent()` với `setStoreEvent`), gọi từ `createCoupon`/`updateCoupon`/`setCouponActive` (`lib/data/coupons.ts`) — coupon vừa tạo/sửa/bật lại mà `exclusive && isActive` và store đã thuộc 1 event sẽ tự động vào `Event.couponId` ngay lúc ghi, không cần đợi store gia nhập event hay chạy lại script backfill thủ công (chiều "gỡ ra" vẫn cố ý không tự động).

**Blog admin — danh sách (`BlogTable.tsx`, `app/admin/blog/page.tsx`)**
- Sort riêng cho admin: Featured/First lên đầu, sau đó theo `createdAt desc` (không đụng `getBlogPosts()` dùng cho `/blog` public).
- Featured/First đổi từ `ToggleButton` sang `AdminDropdownSelect` (2 nút cùng `triggerClassName="w-28"` — độ rộng bằng nhau).
- Thêm cột Date (`createdAt`, thêm mới vào type `BlogPost` + mapper — cột DB đã có sẵn).

**Blog Topics — model mới + CRUD đầy đủ**
- Model `BlogTopic` (`prisma/schema.prisma`, migration `20260705163848_add_blog_topics`) + `BlogPost.topicId` (optional, không đụng `Category`/`categoryId` cũ vốn dùng chung với Store).
- `lib/data/blogTopics.ts`, `lib/validators/admin/blogTopic.ts`, API `app/api/admin/blog-topics/*` (đủ GET/POST/PATCH/DELETE, chặn xoá topic còn bài viết gán — `TOPIC_IN_USE`).
- Trang admin `app/admin/blog/topics/{page,new/page,[id]/page}.tsx` + component `BlogTopicTable.tsx`/`BlogTopicForm.tsx` (mirror Category, bớt icon/parent/SEO).
- Thêm `<select>` "Topic" vào `BlogForm.tsx` (cạnh Category), truyền `topics` prop từ 2 trang new/[id].
- Sidebar (`AdminSidebar.tsx`): "Blog" giờ là nút xổ (chevron xoay), hiện 2 mục con "Topics" + "Blog"; tự mở + tô sáng đúng mục con theo `pathname`.

**Blog admin — form khác (`BlogForm.tsx`, `ImageUploadField.tsx`)**
- Author Avatar: vừa dán URL (kể cả ảnh ngoài, không riêng Cloudinary — `ImageUploadField` thêm prop `allowManualUrl`, dùng `<img>` thường thay vì `next/image` để không bị chặn domain) vừa upload từ máy; upload dùng `deferUpload` (chỉ lên Cloudinary lúc bấm Create/Update Post); để trống → mặc định `/images/logo/logo/app-icon.png` (áp ở API route, không phải client).
- Author Name không còn bắt buộc; để trống → mặc định "NovalyticDeals" (áp ở API route).
- Bỏ field Tags khỏi UI form — vẫn giữ nguyên trong Zod schema/DB dạng `string[]` bắt buộc, chỉ truyền xuyên suốt qua `defaultValues` (giữ nguyên tags cũ khi sửa, mảng rỗng khi tạo mới) để tránh mất dữ liệu và tránh lặp lại bug P2011.
- Fix bug đồng bộ Slug (Title → Slug) y hệt cách đã fix ở Event/Category — bỏ `slugTouched`, resync mỗi lần đổi Title, chỉ khi tạo mới.

## 3. Trạng thái hiện tại

- `npm run typecheck` và `npm run lint` sạch xuyên suốt toàn session (chỉ còn 1 warning có sẵn từ trước, không liên quan — `lib/server/affiliate/redirect.ts` biến `_store` không dùng).
- Dev server chạy tại `http://localhost:3000`, đã restart đúng lúc sau mỗi lần đổi Prisma schema/migration (bắt buộc, Prisma Client không hot-reload).
- 2 migration đã áp dụng lên Supabase thật qua `prisma migrate deploy` (không dùng `prisma migrate dev` — DB này có drift cũ ở vài cột array khiến `migrate dev` đòi reset mất dữ liệu).
- Coupon exclusive giờ tự động union vào `Event.couponId` ngay lúc tạo/sửa/bật lại (`syncCouponWithStoreEvent`) — không còn phụ thuộc script backfill thủ công. Đã chạy 1 lượt quét cuối cùng (không commit vào repo) để xác nhận dữ liệu hiện tại đã đồng bộ đầy đủ (0 event cần cập nhật).
- Đã smoke-test bằng curl các trang public (`/`, `/blog`, `/blog/[slug]`, `/events`, `/events/[slug]`) và các trang admin (chỉ xác nhận được response code do không có session đăng nhập, không đăng nhập bằng browser thật được — user cần tự xác nhận qua UI thật).
- Có 1 hydration warning không liên quan phát hiện tình cờ ở `CouponTable.tsx` (định dạng ngày lệch giữa server/client) — chưa fix, ngoài phạm vi các yêu cầu trong session này.
- Trang public `/blog`'s phần "Topics" hiện vẫn dựa trên field `tags` (tự do), CHƯA nối với model `BlogTopic` mới — theo đúng quyết định giữ nguyên phạm vi ban đầu.

## 4. Bước tiếp theo (tính đến hết session 2026-07-06)

a. User cần tự đăng nhập `/admin` và xác nhận trực tiếp trên UI thật các flow đã sửa trong session (đặc biệt: Featured Coupons dropdown, auto-seed exclusive coupon, Blog Topics CRUD + sidebar submenu, Author Avatar/Name behavior) — nhiều thay đổi mới chỉ được xác minh qua typecheck/lint/curl, chưa qua thao tác tay thật.
b. Nếu muốn "Topics" công khai trên `/blog` phản ánh đúng `BlogTopic` mới thay vì `tags` tự do — cần một task riêng (ngoài phạm vi đã làm).
c. Hydration warning ở `CouponTable.tsx` (ngày tạo lệch server/client) — có thể fix riêng nếu cần, hiện chưa động tới.

## 5. Session update — 2026-07-07

**Blog Body — rich-text toolbar (skill `rich-text-toolbar`), giữ hành vi "## Heading"**
- `components/admin/RichTextEditor.tsx` (component dùng chung với Store's Description/About Store/How To Apply): tắt input-rule mặc định của Tiptap Heading (`StarterKit.configure({ heading: false })` + `Heading.configure({ levels: [1,2,3,4] }).extend({ addInputRules: () => [] })`, thêm `@tiptap/extension-heading` làm dependency trực tiếp trong `package.json`) — gõ `"## "` không còn tự nhảy thành heading thật, chữ `##` ở lại làm text thường; nút Heading dropdown trên toolbar vẫn hoạt động bình thường (chỉ mất gõ tắt).
- `lib/blog.ts`: viết lại `parseBlogSections()` để nhận cả 2 dạng input — HTML thật (Tiptap, bài mới) và plain text cũ (8 bài đã seed từ `data/blog.json`). Cả hai đều theo đúng 1 quy tắc: block nào có text bắt đầu bằng `"## "` → section/Table-of-Contents mới, **độc lập hoàn toàn với heading style thật** (một `<h3>` thật xen giữa không bị tính là mục lục). `BlogSection.paragraphs: string[]` đổi thành `bodyHtml: string` để giữ nguyên format/ảnh/bảng/list lồng nhau trong mỗi section. Có bộ quét block-level top-level tự viết (đếm độ sâu theo tên tag, xử lý đúng list lồng list) — không thêm dependency HTML-parser ngoài.
- `app/blog/[slug]/page.tsx`: render mỗi section bằng `<RichHtml html={section.bodyHtml} />` thay vì map từng đoạn văn plain text; `TableOfContents.tsx` không đổi (chỉ dùng `id`/`heading`).
- `components/admin/BlogForm.tsx`: Body đổi từ `<textarea>` sang `Controller` + `RichTextEditor` (mirror Store), gọi `resolveRichTextImages(data.body)` trong `onSubmit` để upload ảnh chèn/dán lên Cloudinary lúc Create/Update Post.
- Verify: test script mô phỏng HTML Tiptap thật chạy qua `parseBlogSections` (nested `<ul>`, `<table>`, ảnh, `<h3>` thật xen giữa) — tất cả assertion pass; curl 1 bài cũ đã seed xác nhận backward-compat 100% (không cần sửa tay).

**Blog Status (`isActive`) — mirror pattern Store/Coupon**
- Thêm `isActive Boolean @default(true)` vào `BlogPost` (`prisma/schema.prisma` + migration `20260707041129_blog_post_is_active`, đã `prisma migrate deploy` lên Supabase thật, kèm index).
- `lib/data/blog.ts`: tách `getAllBlogPosts()` (không lọc — cho admin) / `getBlogPosts()` (lọc `isActive` — cho public), đúng pattern `getAllStores`/`getStores` và `getAllCoupons`/`getCoupons` đã có sẵn trong repo. `getBlogPostBySlug` trả `undefined` (→ 404) nếu bài đang Hidden. Thêm `setBlogPostActive(id, isActive)`.
- `app/api/admin/blog/[id]/route.ts` PATCH nhận thêm `{isActive}`; `app/admin/blog/page.tsx` và `app/api/admin/blog/route.ts` (GET) đổi sang gọi `getAllBlogPosts()` để admin luôn thấy cả bài Hidden.
- `types/blog.ts` thêm `isActive: boolean`.
- `BlogTable.tsx`: thêm cột **Status** (Active/Hidden) ngay sau cột **First**, dùng đúng màu (`brand`/`red`) và `triggerClassName="w-20"` như Store/Coupon.
- Bug phát hiện lúc test (đã fix, chỉ ảnh hưởng máy dev): cache đĩa của `unstable_cache` (`.next/dev/cache/fetch-cache`) giữ nguyên dữ liệu blog tính toán từ trước khi có cột `isActive` → `/api/blog` trả về rỗng dù DB đúng (object cũ thiếu field `isActive` nên `.filter(p => p.isActive)` loại hết). Khắc phục bằng xoá thư mục cache + restart dev server sau mỗi lần đổi schema — không phải bug logic.
- Verify: set trực tiếp `isActive=false` qua DB cho 1 bài → trang detail 404 + biến mất khỏi `/api/blog` (9→8); bật lại → khôi phục đúng 200/9 bài.

**BlogTable — filter, bỏ ghim, fix bug không cuộn được**
- Thêm 3 dropdown filter Featured/First/Status cạnh ô search (mirror đúng `selectClassName`/`BOOL_FILTER_ALL` pattern của `CouponTable.tsx`).
- `app/admin/blog/page.tsx`: bỏ logic ghim Featured/First lên đầu — giờ danh sách admin chỉ sort theo `createdAt desc` (bài mới tạo lên đầu).
- Fix bug không cuộn/không thấy hết dropdown khi đổi Status/Featured/First ở các dòng gần cuối bảng: div bọc `<table>` trong `BlogTable.tsx` đang dùng `overflow-hidden` (cắt mất phần dropdown menu tràn xuống dưới khung bảng) trong khi `StoreTable.tsx`/`CouponTable.tsx` đều dùng `overflow-x-auto` — đổi lại cho khớp.

**Sidebar — Blog không tự thu gọn khi rời trang**
- `AdminSidebar.tsx`: `openLabel` (điều khiển submenu Blog mở/đóng) trước đó chỉ tính một lần lúc mount qua `useState(() => ...)`; do sidebar không remount khi chuyển route (chỉ `pathname` đổi), Blog cứ giữ mở dù đã sang trang khác (Coupons, Submissions, ...).
- Fix bằng pattern React "adjust state during render" — so `pathname` hiện tại với `prevPathname` lưu trong state ngay trong thân hàm component, khác thì `setOpenLabel(activeParentLabel())` lại ngay lúc render. Cố tình **không** dùng `useEffect` vì lint rule `react-hooks/set-state-in-effect` chặn gọi setState trực tiếp trong effect cho giá trị derive thuần từ prop khác (gây thêm 1 lần render/commit thừa không cần thiết).
- Việc tự bấm chevron mở/đóng thủ công vẫn hoạt động bình thường (không bị ghi đè) vì logic reset chỉ chạy khi `pathname` thực sự đổi.

**Trạng thái hiện tại (cập nhật)**
- `npm run typecheck` và `npm run lint` sạch xuyên suốt (chỉ còn đúng 1 warning cũ không liên quan, như session trước).
- 1 migration mới đã áp dụng lên Supabase thật (`20260707041129_blog_post_is_active`), theo đúng quy trình `prisma migrate deploy` (không dùng `migrate dev`) đã thiết lập từ session trước.
- Toàn bộ thay đổi trong session này (rich-text Body, Status column, filter dropdowns, sort mới, fix sidebar) mới chỉ verify qua typecheck/lint/curl/test script + toggle trực tiếp DB — **chưa** qua thao tác tay thật trên UI (không có session đăng nhập NextAuth qua curl, môi trường không có tool điều khiển browser).

**Bước tiếp theo (session 2026-07-07)**
d. User cần tự đăng nhập `/admin/blog` và xác nhận bằng tay: gõ `## Heading` trong Body không tự nhảy thành heading thật, format/chèn ảnh/bảng qua toolbar mới hoạt động đúng; dropdown Status/Featured/First đổi được và không còn bị cắt ở các dòng cuối bảng; 3 filter mới lọc đúng; danh sách sort theo ngày tạo (không còn ghim Featured/First); vào Blog rồi chuyển sang trang khác thấy submenu tự thu gọn.
e. Các mục (b) và (c) ở Bước tiếp theo của session 2026-07-06 vẫn còn nguyên, chưa làm.
