# Admin UI — User Management — Session Summary — 2026-07-12

## 1. Mục tiêu

Xây dựng module User Management hoàn chỉnh trong admin: form tạo/sửa user, phân quyền chi tiết (Functional authorization) cho Editor, và enforce quyền đó thật sự ở cả UI lẫn API.

## 2. Những phần đã hoàn thành

**Schema (`prisma/schema.prisma`, đã `prisma db push` 2 lần — chưa tạo migration file chính thức)**
- `User` thêm: `fullName`, `avatarUrl`, `phone`, `permissions String[] @default([])`, `status AdminUserStatus @default(ACTIVE)`.
- Enum mới `AdminUserStatus { ACTIVE INACTIVE }`.

**Form Add User (`components/admin/UserForm.tsx`)**
- Thêm field: Full name (bắt buộc), Avatar (upload Cloudinary/Supabase qua `ImageUploadField`, deferUpload), Phone number, Password kèm icon ẩn/hiện (Eye/EyeOff).
- "Functional authorization": checklist quyền, chỉ hiện khi Role = Editor, tự ẩn khi Role = Admin.

**Danh sách quyền (`lib/validators/admin/user.ts` — `EDITOR_PERMISSION_VALUES` / `EDITOR_PERMISSION_OPTIONS`)**
- Đủ tất cả module trừ User Management: stores, coupons, deals, categories, events, blog, reviews, submissions, newsletter, settings_general, settings_integrations, settings_affiliate, settings_author, settings_social, settings_seo, settings_content, settings_footer.

**Trang danh sách User Management (`components/admin/UsersTable.tsx`, `app/admin/users/page.tsx`)**
- Cột: Avatar, Name, Email, Phone, Role (dropdown sửa trực tiếp), Status (dropdown, badge xanh/đỏ), Actions (Edit / Reset password / Delete).
- Role và Status dropdown dùng chung `triggerClassName="w-28"` — width bằng nhau, khớp convention các bảng admin khác.

**Trang Edit User mới (`app/admin/users/[id]/edit/page.tsx`, `components/admin/UserEditForm.tsx`)**
- Sửa Full name / Avatar / Email / Phone / Role / Functional authorization.
- Password: field tuỳ chọn + icon ẩn/hiện — để trống giữ nguyên mật khẩu cũ, nhập giá trị mới thì đổi (song song với `ResetPasswordModal`, không thay thế).
- Chỉ Admin truy cập được (check session role ngay trong page, cộng thêm middleware chặn ở dưới).

**Reset Password Modal (`components/admin/ResetPasswordModal.tsx`)**
- Thêm icon ẩn/hiện mật khẩu.

**Data layer (`lib/data/users.ts`)**
- `createUser` / `updateUser`: chỉ lưu `permissions` khi role = EDITOR (Admin luôn `[]`); `updateUser` chỉ hash + ghi `password` khi có giá trị (không bị đè trắng).
- `updateUserStatus`: chặn tự deactivate chính mình (`CANNOT_DEACTIVATE_SELF`), chặn deactivate Admin active cuối cùng (`countActiveAdmins`).
- `updateUserRole` / `deleteUser`: giữ nguyên guard "last admin" có sẵn.

**API (`app/api/admin/users/[id]/route.ts`)**
- PATCH nhận 4 dạng request, parse theo thứ tự cụ thể → chung: full-edit → role-only → status-only → reset-password (tránh một schema "nuốt" nhầm request của schema khác).

**Enforce quyền thật sự — bug lớn phát hiện + fix trong session**
- Phát hiện: `permissions` đã lưu DB nhưng chưa từng được đọc ở đâu cả — sidebar chỉ lọc theo `role`, `proxy.ts` (Next 16 đổi tên middleware → proxy) dùng danh sách cứng `ADMIN_ONLY_PREFIXES`.
- `lib/permissions.ts` (file mới): map từng path `/admin/*` và `/api/admin/*` → permission key cần thiết; route nào không map tường minh mặc định `ADMIN_ONLY` (fail-safe, không lộ route mới quên gắn quyền). Export `canAccess(role, permissions, pathname)`.
- `proxy.ts`: thay `ADMIN_ONLY_PREFIXES` bằng `canAccess()` — Editor thiếu quyền: trang → redirect `/admin`, API → 403.
- `components/admin/AdminSidebar.tsx`: lọc menu theo `permissions` thực tế của user (không chỉ role).
- `auth.config.ts` / `auth.ts` / `types/next-auth.d.ts`: nhúng `permissions` vào JWT/session ngay lúc đăng nhập (`authorize()` trả thêm `permissions`).
- `auth.ts`: chặn đăng nhập nếu `status === "INACTIVE"`.
- `components/admin/AdminShell.tsx`, `app/admin/layout.tsx`: truyền `permissions` xuống Sidebar.

## 3. Trạng thái hiện tại

- `npx tsc --noEmit` và `npm run lint` sạch xuyên suốt session (chỉ còn 1 warning có sẵn từ trước, không liên quan: `lib/server/affiliate/redirect.ts` biến `_store` không dùng).
- Dev server chạy ổn định tại `http://localhost:3000` — đã restart nhiều lần sau mỗi lần đổi Prisma schema (bắt buộc, Prisma Client không hot-reload).
- Đã `prisma db push` 2 lần lên Supabase thật (không tạo migration file chính thức cho các cột User mới — theo yêu cầu người dùng để tránh drift buộc reset DB).
- Đã verify qua Playwright: tạo/sửa/xoá user, đổi Role/Status trực tiếp, chặn login khi Inactive, chặn tự deactivate chính mình, sidebar lọc đúng theo quyền, redirect `/admin` + API 403 khi Editor cố truy cập module không được cấp, đổi password qua cả 2 đường (modal reset và form edit, kể cả để trống không đổi) — tất cả pass, không lỗi console.
- Mọi tài khoản test tạo ra trong lúc verify đã xoá sạch khỏi DB thật; không đụng vào tài khoản thật của người dùng.

## 4. Bước tiếp theo

- Session dùng JWT strategy: đổi `permissions`/`status` của một user **đang đăng nhập sẵn** không có hiệu lực ngay lập tức — user đó cần đăng xuất/đăng nhập lại để token mới phản ánh đúng.
- Chưa có migration file chính thức trong `prisma/migrations/` ghi lại thay đổi User model (mới chỉ `db push` trực tiếp) — cân nhắc tạo migration sau nếu cần lịch sử sạch hoặc đồng bộ sang môi trường khác.
- Khi thêm module admin mới trong tương lai: bắt buộc thêm entry vào `lib/permissions.ts` (route mapping) + `EDITOR_PERMISSION_VALUES`/`OPTIONS` + `AdminSidebar.tsx` — nếu quên, route mới sẽ mặc định `ADMIN_ONLY` (Editor không vào được dù có định cấp quyền).
- Hiện tại khi Editor bị chặn truy cập (redirect về `/admin`) chưa có toast/thông báo lý do — có thể cải thiện UX sau nếu cần.
- Toàn bộ thay đổi mới chỉ verify qua Playwright script tự động, chưa qua thao tác tay thật trên UI — nên tự kiểm tra lại trực tiếp một lượt.

## 5. Session update — 2026-07-13

**Push code**
- Đã commit + push toàn bộ nội dung mục 1–4 lên `origin/main` (repo `Novalytic-Deals`), kèm luôn phần việc tồn đọng từ session trước (Event/Store/Blog-topics). Message commit bị hook trong repo rút gọn thành "edit user management" (không sao, nội dung diff đầy đủ).

**Icon ẩn/hiện password + field password trong form sửa user**
- `components/admin/ResetPasswordModal.tsx`: thêm icon Eye/EyeOff toggle ẩn/hiện.
- `components/admin/UserEditForm.tsx`: thêm field Password tuỳ chọn (kèm icon ẩn/hiện) — để trống giữ nguyên mật khẩu cũ, nhập giá trị mới thì đổi. `lib/validators/admin/user.ts` (`adminUpdateUserSchema.password`) và `lib/data/users.ts` (`updateUser`) chỉ hash + ghi đè khi có giá trị.

**Cố định width nút Role/Status**
- `components/admin/UsersTable.tsx`: cả 2 `AdminDropdownSelect` (Role, Status) dùng `triggerClassName="w-28"` — căn đều nhau, khớp convention các bảng admin khác (Store/Coupon/Deal/Blog/Category).

**Tự động phát hiện tài khoản bị deactivate/xoá giữa phiên — tính năng mới**
- Bối cảnh: session dùng JWT, đổi `status` hoặc xoá user không tự invalidate phiên đang mở của chính họ.
- `app/api/admin/session/status/route.ts` (mới): API `GET` trả `{ active: boolean }` dựa trên `getUserById(session.user.id)` — user không tồn tại hoặc `status !== "ACTIVE"` → `active: false`.
- `lib/permissions.ts`: thêm ngoại lệ cho route này (`permission: null`, mở cho mọi user đã đăng nhập bất kể role).
- `components/admin/AccountStatusWatcher.tsx` (mới, client component): poll API mỗi 20s + khi tab focus lại (`focus`/`visibilitychange`); khi `active: false` → hiện overlay chặn toàn màn hình, không có nút đóng/click-outside, tự `signOut({ callbackUrl: "/admin/login" })` sau 8s nếu người dùng không bấm nút "Đăng xuất ngay".
- `components/admin/AdminShell.tsx`: mount `<AccountStatusWatcher />` — áp dụng cho mọi trang admin đã đăng nhập.
- Verify bằng Playwright (2 kịch bản, tài khoản test tạo riêng rồi xoá sạch sau khi xong): (1) Admin đổi Status Editor khác đang mở phiên → dialog hiện sau ~16s, tự đăng xuất về `/admin/login`; (2) Admin xoá tài khoản Editor đang mở phiên → dialog cũng hiện đúng.
- `npx tsc --noEmit` và `npm run lint` sạch.

**Trạng thái / bước tiếp theo cập nhật**
- Các thay đổi mục này **chưa commit/push** — vẫn nằm ở working tree.
- Độ trễ phát hiện tối đa ~20s (chu kỳ poll) — không phải real-time tức thì; có thể giảm `POLL_INTERVAL_MS` trong `AccountStatusWatcher.tsx` nếu cần nhanh hơn, đánh đổi với tần suất gọi API.
- Bullet "chưa có toast/thông báo lý do khi Editor bị chặn truy cập route" (mục 4 cũ) vẫn chưa làm — khác với tính năng mới này (tính năng mới chỉ xử lý case tài khoản bị deactivate/xoá, không phải case thiếu quyền một module cụ thể).
