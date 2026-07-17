# Store Admin — Tóm tắt tính năng

Tài liệu này chỉ ghi lại phần **Store** (bảng quản lý, form, vòng đời, Popular Stores). Các phần khác của khu vực admin (Dashboard, Coupon/BlogPost/Event, rate-limit upload...) không thuộc phạm vi file này.

## 1. Bảng Store (`components/admin/StoreTable.tsx`)

- Cột: Logo (44px), Name, Category, Event, Featured, Pin, Status, Date, Actions (đã bỏ cột **Rating**).
- Event/Featured/Pin/Status là dropdown đổi nhanh (`AdminDropdownSelect`, PATCH thẳng field tương ứng).
- Bộ lọc: search theo tên + 1 nút **"Filter"** duy nhất mở Modal chứa 5 mục chọn-1-giá-trị (Category, Event, Featured, Pin, Status) — trước đây là 3 dropdown rời (Event/Featured/Status) nằm ngang, nay gộp lại và bổ sung thêm Category + Pin. Có filter nào khác mặc định → hiện nút **"Clear All"** cạnh nút Filter để reset cả 5 cùng lúc (không đụng ô search).
- Bulk-select (nút "Select Items" → checkbox từng dòng → "Delete (N)").
- Phân trang dùng chung `lib/hooks/useAdminPagination.ts` (page-size 20/50/100/200, ẩn nếu ≤20 item) — **đã fix bug** nhảy về page 1 mỗi khi sửa 1 dòng (nguyên nhân: so sánh reference thay vì "chữ ký" id; hook giờ chỉ reset khi tập hợp/thứ tự id thực sự đổi).
- Subtitle `{stores.length} stores.` dưới tiêu đề trang.
- Store mới tạo luôn lên đầu bảng (`getAllStoresCached` có `orderBy: createdAt desc`).

## 2. Form Store (`components/admin/StoreForm.tsx`)

- Bắt buộc: Name, Slug (tự sinh từ Name lúc **tạo mới**, không tự đổi khi sửa store cũ để tránh vỡ URL/SEO), Logo, Website, Affiliate Link, Category (single-select), About Store.
- Logo/Banner: upload thật qua Cloudinary hoặc Supabase Storage (`ImageUploadField`).
- Description / About Store / How To Apply: rich text editor (TipTap) — heading, màu chữ/highlight, bảng, chèn ảnh (upload hoặc dán URL ngoài, hỗ trợ paste ảnh copy từ web), để trống thì auto-fill theo Content Configuration templates.
- FAQ: thêm tay hoặc "Paste FAQs" (dán hàng loạt, cộng dồn không ghi đè).
- Region/Rating/RatingCount không có trong form — tạo mới tự set (`region=GLOBAL`, `rating=5`, `ratingCount` random), sửa thì giữ nguyên giá trị cũ.
- Event: dropdown chọn 1 event (đồng bộ 2 chiều với `EventForm`, 1 store chỉ thuộc 1 event).
- Checkbox **Featured** + **Pin** (cạnh nhau, độc lập — xem mục 4).
- Trùng Slug → lỗi 409 rõ ràng (`SLUG_TAKEN`) thay vì crash 500.

## 3. Vòng đời Store: Status & Delete

- **Status (isActive) toggle** cascade sang dữ liệu con:
  - Coupon: tắt Store → tắt hết Coupon; bật lại Store → chỉ bật Coupon còn hạn (`expiresAt` null hoặc chưa tới hạn), Coupon hết hạn giữ Hidden.
  - Deal: không có khái niệm hết hạn nên cascade vô điều kiện cả 2 chiều.
- **Xóa Store**: `Coupon`/`Review` cascade ở tầng DB (`onDelete: Cascade`), không cần validate chặn xóa. Dọn thêm phần DB cascade không tự lo: purge cache tag từng coupon bị mất, và lọc id coupon đã xóa khỏi `Event.couponId` (mảng tự quản lý, không phải FK thật).

## 4. Pin & Popular Stores tự động (theo click)

- **`Store.isPin`**: chỉ có tác dụng khi kết hợp `isFeatured=true`. Store Pin+Featured luôn ở đầu khối "Popular stores" trang home, nhiều store cùng Pin thì sắp theo `updatedAt` giảm dần.
- **Click tracking**: `currentMonthClicks` (+1 mỗi lượt redirect `/go/[couponId]`), `lastMonthClicks` (đóng băng tháng trước) — thay cho cột `clickCount` (tổng lifetime) đã xóa.
- **Nút "Refresh Popular"**: xếp hạng lại theo `currentMonthClicks` — store Pin+Featured giữ nguyên, các slot còn lại (theo `featuredStoresCount` trong Content Config) trao cho store click cao nhất bằng cách bật/tắt `isFeatured`.
- **Switch "Auto Popular"**: bật thì tự động, vào lượt đọc đầu tiên sau 00:00 UTC ngày đầu tháng (kiểu lazy, không cron job thật — cùng pattern với `storeSeoSnapshot.ts`), rollover `currentMonthClicks → lastMonthClicks` (reset về 0) rồi xếp hạng lại theo `lastMonthClicks`.
- Cấu hình lưu ở `SiteSetting` key `popular_stores_config` (`autoPopularEnabled`, `lastRefreshedAt`, `lastRolloverPeriod`).
- Cả 3 control (Auto Popular switch, Refresh Popular, Add Store) nằm cùng hàng trong `PopularStoresControls.tsx`, dòng "last refreshed" bên dưới.
- ⚠️ Cơ chế này **dùng lại chính cột `isFeatured`** (đã hỏi và người dùng chọn) — nên cũng ảnh hưởng tới mục "Featured Stores" riêng ở trang `/stores` (dùng chung field, ngoài chủ đích ban đầu nhưng đã được xác nhận chấp nhận).
- Đã fix bug UI: icon switch (chấm tròn) bị lệch ra ngoài track khi bật do thiếu `left-0.5` làm mốc — nay confine đúng trong track (`left-0.5` + `translate-x-4`).

## 5. Ghi chú/lưu ý vận hành

- **DB đang có drift** giữa `prisma/migrations/` và schema thật trên Supabase — luôn dùng `prisma db push` (không dùng `migrate dev`/`migrate reset`, sẽ đòi reset toàn bộ dữ liệu thật).
- **`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`** trong `.env` không còn hoạt động — DB đang dùng tài khoản thật, không có mật khẩu để test tự động qua HTTP.
- Các hàm dùng `unstable_cache`/`revalidateTag` (khắp `lib/data`, `lib/content`) **không gọi được từ script `tsx` độc lập** (thiếu Next.js request context) — muốn test ngoài UI phải tách phần pure function ra test riêng, phần còn lại lặp lại đúng câu lệnh Prisma bên trong bằng tay.
- Bug nhỏ có từ trước, chưa sửa: cột Date của `StoreTable` dùng `toLocaleDateString()` không chỉ định locale → hydration mismatch nếu locale server/client khác nhau (không crash, chỉ warning).
- Bug có từ trước không liên quan Store: `POST /api/admin/events` không gán đúng `featuredStoreIds` lúc tạo mới.

## 6. Chưa test qua UI thật

Phần lớn tính năng Pin/Popular Stores (checkbox, dropdown Pin, nút Refresh Popular, switch Auto Popular, thứ tự thật trên trang home) mới chỉ verify bằng script Prisma trực tiếp — cần người dùng tự xác nhận trên UI khi có tài khoản đăng nhập thật.
