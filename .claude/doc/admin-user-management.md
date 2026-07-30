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

## 6. Session update — 2026-07-13 (phần 2)

**Fix autofill Add User (khác icon ẩn/hiện đã làm ở mục 5 — đây là bug pre-fill nhầm)**
- Nguyên nhân xác nhận qua Explore agent: `UserForm.tsx`, `UserEditForm.tsx`, `ResetPasswordModal.tsx` dùng `id="email"`/`id="password"` giống hệt `LoginForm.tsx`, cùng origin, không field nào có `autoComplete` → trình duyệt tự gợi ý/điền nhầm mật khẩu đăng nhập đã lưu vào form tạo user mới.
- Fix: `UserForm.tsx`/`UserEditForm.tsx` — `<form>` + email input thêm `autoComplete="off"`, password input thêm `autoComplete="new-password"`. `ResetPasswordModal.tsx` — password thêm `autoComplete="new-password"`. `LoginForm.tsx` giữ nguyên (autofill ở form login là mong muốn).

**Tính năng mới lớn: switch "Full data access" theo từng module cho Editor**
- Bối cảnh: trước đây Editor được cấp quyền 1 module (vd "stores") là thấy/sửa TẤT CẢ record của module đó. Yêu cầu mới: thêm switch (mặc định TẮT) theo từng module — TẮT = Editor chỉ thấy/sửa/xoá record do chính họ tạo (kể cả qua tìm kiếm/lọc trên trang); BẬT = như cũ (thấy hết).
- Áp dụng đúng 6 module: Stores, Coupons, Deals, Categories, Events, Blog. Loại trừ Reviews/Submissions/Newsletter — xác nhận qua 2 Explore agent: 3 bảng này luôn được tạo bởi khách công khai qua form public (đánh giá store, submit coupon, đăng ký newsletter), không có khái niệm "editor tạo ra nó".
- Schema (`prisma/schema.prisma`, đã `prisma db push`): `User.fullDataAccess String[] @default([])` (shape giống hệt `permissions`); thêm `createdById String?` (scalar thường, cố ý không dùng `@relation` — không cần back-navigation `user.createdStores`) vào `Store`, `Coupon`, `Deal`, `Category`, `Event`, `BlogPost`.
- Backfill (an toàn, chỉ `UPDATE` không `DELETE`): toàn bộ 640 record cũ (100 stores, 484 coupons, 11 deals, 26 categories, 10 events, 9 blog posts) gán `createdById` = tài khoản thật `novalytic.studio@gmail.com`.
- `lib/validators/admin/user.ts`: thêm `DATA_SCOPED_PERMISSION_VALUES` (6 key trên) + `isDataScopedPermission()` type guard; `adminCreateUserSchema`/`adminUpdateUserSchema` thêm `fullDataAccess` + `.refine()` đảm bảo `fullDataAccess ⊆ permissions`.
- Session/JWT: `auth.ts`, `auth.config.ts`, `types/next-auth.d.ts`, `types/settings.ts`, `lib/data/users.ts` — nhúng `fullDataAccess` xuyên suốt, y hệt cách `permissions` đã làm.
- `lib/permissions.ts`: thêm `isDataScoped(role, fullDataAccess, module)` — tầng row-level, song song và độc lập với `canAccess` (tầng module-level cũ vẫn giữ nguyên, không đụng).
- `lib/server/api/ownership.ts` (mới): `authorizeRecordAccess(id, module, getOwnerId)` dùng chung cho `[id]/route.ts` của cả 6 module — chặn trước mọi logic khác (kể cả guard nghiệp vụ có sẵn như `CATEGORY_IN_USE`/`EVENT_IN_USE`).
- Store/Coupon/Deal/Blog: thêm `createdById` vào filter (`Admin*Filters`) + `where` của hàm list phân trang có sẵn; tách field tạo-mới-riêng (`Admin*CreateFields`) để không đụng hàm update; thêm `get<Module>OwnerId`; API POST gọi `auth()` gắn `createdById`; API `[id]` gọi `authorizeRecordAccess`; trang list tính `scoped` rồi truyền `createdById` vào filter; **trang edit thêm check ownership → `notFound()` nếu không phải chủ** (lỗ hổng dễ bỏ sót: trang edit trước đó không hề bị chặn xem dù API save vẫn 403 — tức editor có thể mở xem form của record người khác dù không lưu được).
- Category/Event: KHÔNG sửa `getCategories()`/`getEvents()` (vẫn giữ làm nguồn picker/dropdown không lọc cho các form khác) — thêm hàm mới song song `getCategoriesAdmin()`/`getEventsAdmin()` chỉ dùng cho trang admin list, cache theo scope bằng cách tự ghép `scopeKey` vào `keyParts` của `unstable_cache` (giữ đúng pattern cache-theo-tham-số đã có sẵn trong repo, không dựa vào cơ chế hash tham số ngầm của `unstable_cache` — rủi ro rò rỉ cache chéo giữa các editor nếu đoán sai cơ chế).
- UI: component mới `components/admin/InlineSwitch.tsx` (switch thuần, không tự gọi API — khác `ToggleButton.tsx` có sẵn vốn tự PATCH ngay khi click); gắn vào `UserForm.tsx`/`UserEditForm.tsx`, chỉ hiện cạnh 6 permission tương ứng và chỉ khi permission đó đã tick.

**Bug phát hiện + tự sửa trong lúc build**
- `lib/data/autoFillImport.ts` (tool import Excel hàng loạt cho Store/Coupon) gọi thẳng `createStore`/`createCoupon`, ban đầu quên truyền `createdById` — `npx tsc --noEmit` bắt lỗi ngay nhờ đổi `Admin*Fields` thành `Admin*CreateFields` bắt buộc field này. Đã nối dây `auth()` vào `app/api/admin/auto-fill-store/import/route.ts`.
- `lib/server/api/ownership.ts`: dùng `ReturnType<typeof auth>` để suy ra type `Session` bị sai — `auth` là hàm overload (vừa dùng kiểu gọi thường vừa dùng kiểu wrap middleware trong `proxy.ts`), `ReturnType` lấy nhầm overload cuối cùng. Sửa bằng cách import thẳng `type { Session } from "next-auth"` thay vì suy luận qua `ReturnType`.
- Lúc test phát hiện có 2 tiến trình `next-server` chạy song song (1 cái cũ còn giữ port 3000 từ trước khi sửa `auth.config.ts`) khiến `fullDataAccess` "biến mất" khỏi session lúc test — do gọi nhầm vào server cũ chưa có code mới. Đã `kill` đúng theo PID cụ thể (pattern match theo tên tiến trình không đủ) và khởi động lại sạch.

**Verify**
- Không login được qua UI thật trong test tự động nữa vì Turnstile (CAPTCHA) đã bật thật (`TURNSTILE_SECRET_KEY` có giá trị thật trong `.env`, khác lúc trước trong session) — chuyển hướng test: tự ký session cookie bằng `next-auth/jwt`'s `encode()` (đúng `NEXTAUTH_SECRET` + `salt: "authjs.session-token"`) rồi bơm thẳng vào Playwright context, bỏ qua bước đăng nhập UI.
- Đã verify: Store (11 kịch bản — list/search chỉ thấy của mình, trang edit của người khác 404, PATCH/GET của người khác 403, sửa/xoá của mình vẫn được, editor full-access thấy hết, admin thấy hết); Category (2 vòng lặp xen kẽ 2 editor để xác nhận cache không rò rỉ chéo); switch UI (xác nhận qua computed style — đổi màu nền khi bật, và submit gửi đúng `fullDataAccess` trong payload).
- `npx tsc --noEmit` và `npm run lint` sạch (0 error).
- Toàn bộ tài khoản/record test đã xoá sạch khỏi DB thật sau khi verify xong; không đụng dữ liệu thật.

**Trạng thái / bước tiếp theo**
- **Chưa commit/push** — toàn bộ thay đổi mục 6 vẫn nằm ở working tree.
- Cố tình CHƯA làm: bước cuối cùng siết `createdById` từ nullable sang `NOT NULL` trên 6 bảng — chỉ nên làm sau khi xác nhận code đã chạy ổn định thực tế một thời gian (làm ngay có rủi ro nếu còn sót path tạo record nào chưa gắn `createdById` sẽ lỗi ngay lập tức).
- JWT session: đổi `fullDataAccess` cho 1 editor đang đăng nhập sẵn không có hiệu lực ngay — giống hệt hạn chế đã ghi nhận với `permissions`/`status` trước đó (mục 4).
