# Admin UI — Deals — Session Summary

## Mục tiêu
Xây module quản trị "Deals" mới trong admin, tách biệt hoàn toàn khỏi `Coupon`, theo pattern list/form đã có của Stores/Coupons.

## Những phần đã hoàn thành

### Giai đoạn 1 — Xây module Deals từ đầu
- **Quyết định kiến trúc** (user xác nhận qua AskUserQuestion): tạo model `Deal` Prisma mới, độc lập khỏi `Coupon` (không đụng logic Coupon: discount, SEO snapshot, templates, vote...); chỉ làm phần admin, chưa wiring ra public site; Type=Code có ô Code riêng.
- **Prisma**: enum `DealType` (`DEAL`/`CODE`), `model Deal` (bảng `deals`) với `storeId` (FK Store, cascade delete), `eventId` (FK Event, optional), `name`, `type`, `code?`, `originalPrice?`, `price`, `url`, `imageUrl`, `description?`, `isFeatured`, `isActive`. Thêm `deals Deal[]` back-relation vào `Store`/`Event`. Migration `prisma/migrations/20260711034826_add_deal/`.
- **Data/types**: `types/deal.ts`, `lib/validators/admin/deal.ts` (`adminDealSchema`, `.superRefine` bắt buộc `code` khi `type=CODE`), `lib/data/deals.ts` (CRUD + `setDealActive` guard `STORE_INACTIVE`).
- **Cascade Store→Deal**: mở rộng `lib/data/stores.ts` — `setStoreActive` cascade `isActive` sang toàn bộ Deal của store (không check hạn vì Deal không có expiry); `deleteStore` purge cache `deals:list` khi store có deal.
- **API**: `app/api/admin/deals/route.ts` (GET/POST), `app/api/admin/deals/[id]/route.ts` (GET/PATCH — full update, `{isFeatured}`, `{isActive}`, `{eventId}` — /DELETE).
- **UI**: `components/admin/DealForm.tsx` (mirror CouponForm/StoreForm: slug random, Store searchable dropdown, Type/Code có điều kiện, Event select, Original Price/Price, Image deferred-upload, Description, Featured; không có field Status), `components/admin/DealTable.tsx` (cột Image/Name/Store/Type/Event/Featured/Status/Actions, toolbar search+filter, bulk delete, pagination).
- **Pages**: `app/admin/deals/page.tsx`, `new/page.tsx`, `[id]/page.tsx`.
- **Nav/dashboard**: thêm "Deals" (icon `Tags`) vào `AdminSidebar.tsx` sau "Coupons"; `lib/data/admin/analytics.ts` đổi tile "Deals" sang đếm `prisma.deal.count()` thay vì `Coupon` type=DEAL.

### Giai đoạn 2 — Tinh chỉnh theo yêu cầu tiếp theo
- Thêm dòng đếm `"{deals.length} deals."` vào `app/admin/deals/page.tsx` (giống Coupons).
- Bỏ hẳn cơ chế khoá scroll toàn trang khi mở dropdown trong `components/admin/SingleSelectDropdown.tsx` (áp dụng toàn cục, ảnh hưởng mọi nơi dùng component này).
- Slug tự sinh `deals-{12 ký tự ngẫu nhiên}` **khi bắt đầu gõ Name** (không còn sinh sẵn lúc mount) — chỉ sinh 1 lần, dừng lại nếu user tự sửa Slug tay (guard `slugTouched`).
- Thêm 2 field mới vào `Deal`: `categoryId` (FK Category, optional) và `offer` (text, optional) — migration riêng `prisma/migrations/20260711113227_deal_category_offer/`. Cập nhật đồng bộ `types/deal.ts`, `adminDealSchema`, `lib/data/deals.ts`, 2 API route.
- `DealForm.tsx`: thêm field **Category** (dropdown search, optional, đặt sau Event) và **Offer** (đặt sau Original Price/Price, tự tính `-{%}` từ 2 giá đó, vẫn sửa tay được — guard `offerTouched`).
- Truyền `categories` prop (từ `getCategories()`) vào `app/admin/deals/new/page.tsx` và `[id]/page.tsx`.

### Giai đoạn 3 — Click tracking + "Refresh Deal" / "Auto Deal" cho "Today's best deals"

**Bối cảnh phát hiện đầu giai đoạn**: giữa 2 session, **một session khác** (không thuộc phạm vi tài liệu này) đã tự wiring `Deal` vào trang chủ — `getFeaturedDeals()` (lọc `isFeatured && isActive`, giới hạn `config.pagination.bestDealsCount`) hiển thị bằng `components/deal/DealProductCard.tsx` tại section "Today's best deals" (`app/page.tsx`). Cũng đã tồn tại sẵn 1 hệ thống tương tự cho Store tên "Popular Stores" (`lib/content/popularStoresRefresh.ts`, `Store.currentMonthClicks`/`lastMonthClicks`/`isPin`, `PopularStoresControls.tsx`) — session này **mirror lại chính xác** hệ thống đó cho Deal, đổi chu kỳ tháng → 8 tiếng.

Quyết định đã xác nhận với user (khác Store):
1. **Không đổi UX click hiện tại** của Deal (vẫn `window.open(deal.url)` trực tiếp, không tạo route `/go/deal/[id]`) — chỉ bắn 1 "ping" ngầm khi bấm "Get Deal"/"Show Code".
2. **Dùng lại field `isFeatured`** có sẵn để đánh dấu thắng xếp hạng (ghi đè Featured admin tự bật tay) — không thêm flag riêng.
3. "Refresh Deal" chỉ re-rank theo `lastHourClicks` **hiện có** (không đụng `currentHourClicks`); chỉ "Auto Deal" (8h/lần) mới rollover `currentHourClicks → lastHourClicks` rồi reset về 0.

Đã làm:
- **Prisma**: thêm `currentHourClicks`/`lastHourClicks` (`Int @default(0)`) vào `Deal`. Migration `prisma/migrations/20260716151157_deal_hourly_clicks/`.
- **Types**: `types/deal.ts` thêm 2 field click; `types/settings.ts` thêm `DealRefreshSettings` (`autoDealEnabled`, `lastRefreshedAt`, `lastRolloverAt` — dùng elapsed-time thay vì period-key kiểu "YYYY-MM" vì 8h không có mốc lịch tự nhiên).
- **`lib/data/deals.ts`**: thêm `getDeals()` (active-only getter), `incrementDealCurrentHourClicks`, `applyDealFeaturedSelection(winnerIds)` (mirror `applyFeaturedSelection` của Store), `rolloverHourlyDealClicks()` (raw SQL).
- **`lib/data/settings.ts`**: thêm `DEAL_REFRESH_KEY`, `DEFAULT_DEAL_REFRESH_SETTINGS`, `getDealRefreshSettings`/`setDealRefreshSettings` (mirror y hệt `PopularStoresSettings`, SiteSetting key-value, `unstable_cache` revalidate 60s).
- **`lib/content/dealsRefresh.ts`** (file mới, mirror `popularStoresRefresh.ts`): `rankDealsByClicks` (sort theo `lastHourClicks` desc, tie-break `createdAt` desc, không có khái niệm Pin cho Deal), `refreshDealsNow()` (manual, không rollover), `ensureAutoDealRollover()` (lazy — check `Date.now() - lastRolloverAt >= 8h`, nếu đủ thì rollover + re-rank).
- **Click endpoint công khai**: `lib/server/cache/rateLimit.ts` thêm `dealClickRateLimit`; `app/api/deals/[id]/click/route.ts` (POST, public, rate-limited, mirror pattern của `/api/coupons/[slug]/vote`).
- **`components/deal/DealProductCard.tsx`** (sửa file do session khác tạo): thêm `pingDealClick()` bắn `fetch(..., {keepalive:true})` ngay trong `handleTrigger()` — cả nhánh "Get Deal" lẫn "Show Code" đều được tính, không đổi hành vi mở link.
- **Admin API**: `app/api/admin/deals/refresh/route.ts` (POST → `refreshDealsNow`), `app/api/admin/deals/auto-deal/route.ts` (PATCH `{enabled}` → `setDealRefreshSettings`).
- **`components/admin/DealControls.tsx`** (file mới, mirror `PopularStoresControls.tsx`): switch "Auto Deal" + nút "Refresh Deal" (icon xoay khi loading) + nút "Add Deal" (giữ nguyên) + dòng "Deals last refreshed: {date/Never}". Wired vào `app/admin/deals/page.tsx` (thay thế nút Add Deal đơn lẻ cũ), fetch thêm `getDealRefreshSettings()`.
- **`app/page.tsx`**: thêm `await ensureAutoDealRollover()` cạnh `ensurePopularStoresAutoRollover()` có sẵn, trước khi đọc `getFeaturedDeals()`.
- Đã verify thật qua HTTP (không cần login): `POST /api/deals/{id}/click` tăng đúng `currentHourClicks` (test xong đã reset lại 0), `/api/admin/deals/refresh` và `/api/admin/deals/auto-deal` trả 401 khi chưa đăng nhập, trang chủ vẫn 200 với rollover mới wire vào.

### Giai đoạn 4 — Áp dụng skill `filter` cho DealTable
- Gộp 4 dropdown rời (Type/Event/Featured/Status) trong `components/admin/DealTable.tsx` thành 1 nút **"Filter"** (mở `Modal`) + nút **"Clear All"** (chỉ hiện khi có filter đang áp dụng) — đúng skill `.claude/skills/filter.md` (pattern draft/applied state: chọn trong Modal chưa lọc bảng ngay, chỉ áp dụng khi bấm "Apply filter"; Cancel/Esc/click ngoài huỷ draft không đổi bảng).
- **Store filter giữ nguyên** dạng dropdown search độc lập ngoài Modal — không nằm trong bộ 4 field được gộp (theo đúng yêu cầu user, chỉ định rõ Type/Event/Featured/Status).
- Cập nhật mục "Already applied to" trong `.claude/skills/filter.md` để ghi nhận `DealTable`.
- Bản đầu của giai đoạn này render 4 field bằng `<select>` gốc (native) — đây là nguồn gốc bug phát hiện ở Giai đoạn 5 bên dưới.

### Giai đoạn 5 — Fix bug select lag + đổi 4 field Filter sang `SingleSelectDropdown`

**Bug report từ user**: mở modal Filter trên `/admin/deals`, bấm vào 4 dropdown (Type/Event/Featured/Status) phải mất vài giây mới hiện, đôi khi phải bấm mấy lần mới hiện. Dùng `AskUserQuestion` xác nhận phạm vi: **chỉ** 4 select trong modal Filter bị, các dropdown khác (Store filter, cột Event/Featured/Status trong bảng) bình thường.

**Nguyên nhân**: `components/ui/Modal.tsx` canh giữa `Dialog.Content` bằng `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, cộng animation `data-[state=open]:animate-fade-up` (`transform: translateY(8px) → translateY(0)`) — `translateY(0)` vẫn tính là có `transform`, nên `Dialog.Content` luôn là phần tử "transformed" suốt thời gian modal mở. Đây là bug Chrome đã biết: `<select>` gốc nằm trong 1 ancestor có `transform` sẽ mở popup bị trễ/đôi khi cần bấm lại. Các dropdown khác không bị vì chúng là custom div-based (`SingleSelectDropdown`/`AdminDropdownSelect`), không dùng popup `<select>` của trình duyệt.

**Fix 1 — `components/ui/Modal.tsx`** (ảnh hưởng toàn bộ app, mọi Modal dùng chung component): đổi canh giữa từ `transform` sang flexbox (`Dialog.Overlay` thêm `flex items-center justify-center`, bỏ hết `left-1/2 top-1/2 -translate-x/y-1/2` khỏi `Dialog.Content`); đổi animation `Dialog.Content` từ `animate-fade-up` sang `animate-fade-in` (chỉ fade opacity, không còn `transform` nào tồn tại trên `Dialog.Content` khi mở).

**Fix 2 (yêu cầu tiếp theo của user)** — "dùng dropdown giống kiểu dropdown lọc Store cho filter": thay hẳn 4 `<select>` gốc trong modal Filter của `DealTable.tsx` bằng `components/admin/SingleSelectDropdown.tsx` (đúng widget đang dùng cho Store filter) — vừa đồng bộ UI, vừa né hẳn class bug native-select-in-transformed-dialog dù Fix 1 đã sửa gốc. Thêm 4 mảng options mới (`typeFilterOptions`, `eventFilterOptions` có `searchable`, `featuredFilterOptions`, `statusFilterOptions`); xoá `selectClassName` không còn dùng.
- `typecheck`/`lint` sạch sau cả 2 fix.

**Cập nhật skill**: `.claude/skills/filter.md` cập nhật mục "Pieces already built" (ghi chú Modal.tsx không được dùng `transform` nữa + khuyến nghị dùng `SingleSelectDropdown` thay `<select>` gốc cho mọi field trong Filter panel từ nay), bước 6 đổi snippet mẫu sang `SingleSelectDropdown`, mục "Already applied to" đánh dấu `DealTable` là bản tham chiếu hiện tại (đã dùng `SingleSelectDropdown`) — `StoreTable` sau đó cũng được cập nhật theo (không phải trong phạm vi tài liệu Deal này, ghi nhận qua chỉnh sửa của session/actor khác trên cùng file skill).

## Trạng thái hiện tại
- `typecheck`, `lint`, `build` đều sạch (chỉ còn 1 warning cũ không liên quan ở `lib/server/affiliate/redirect.ts`).
- Dev server chạy ổn tại `localhost:3000` (Turbopack).
- **Deal đã được wiring ra public site** (mục "chưa làm" cũ ở Giai đoạn 1/2 nay đã không còn đúng) — hiển thị ở "Today's best deals" trang chủ, có click tracking + xếp hạng tự động/thủ công theo Giai đoạn 3.
- Modal Filter trên `/admin/deals` (Giai đoạn 4) đã hết bug select-lag và giờ dùng `SingleSelectDropdown` đồng bộ với Store filter (Giai đoạn 5).
- Vẫn **chưa có** trang chi tiết Deal riêng (`/deal/[slug]`), chưa có trong sitemap/JSON-LD.
- **Chưa test tay qua trình duyệt** (đăng nhập admin) cho toàn bộ Giai đoạn 2–5 — giới hạn đã ghi nhận từ các session trước, không tự động hoá được login qua script.

## Bước tiếp theo
1. User tự đăng nhập admin, test tay theo checklist đã lập (Giai đoạn 1–2: tạo Deal Type=Deal/Code, slug auto-gen theo Name, Store/Category dropdown search + vẫn cuộn trang được, Original Price+Price → Offer tự tính %, deactivate/xoá Store có Deal → cascade đúng, trùng slug → lỗi 409).
2. Test riêng Giai đoạn 3: bấm "Get Deal"/"Show Code" ở Home → xác nhận click được ghi nhận; bấm "Refresh Deal" → Featured cập nhật đúng theo `lastHourClicks`; bật "Auto Deal", đợi hoặc set tay `lastRolloverAt` cũ trong DB → tải lại Home → xác nhận rollover + re-rank đúng; tắt "Auto Deal" → Today's best deals giữ nguyên dù có click mới.
3. Test riêng Giai đoạn 4–5: mở Filter trên `/admin/deals`, xác nhận cả 4 dropdown (Type/Event/Featured/Status) mở ngay không còn trễ/cần bấm lại; đổi field (bảng chưa lọc ngay), Apply (lọc đúng), Cancel sau khi đổi (bảng không đổi, mở lại Filter thấy giá trị cũ), Clear All (xoá hết, ẩn nút).
4. Chưa quyết định Deal có cần hiển thị Category/click-count như cột trong `DealTable.tsx` hay không — hiện chỉ có trong form/DB, chưa hiện trong bảng danh sách.
5. Chưa có trang chi tiết Deal riêng (`/deal/[slug]`) + sitemap/JSON-LD — nếu cần làm tiếp thì đây là việc còn lại duy nhất chưa động tới trong toàn bộ phạm vi Deal.
