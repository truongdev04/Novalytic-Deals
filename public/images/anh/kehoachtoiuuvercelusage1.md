# Kế hoạch tối ưu ISR Writes, CPU & Origin Transfer — Novalytic Deals

**Ngày lập:** 29/08/2026
**Project:** `novalytic-deals` (Vercel Hobby, team `truonghvts-projects`)
**Repo:** `truongdev04/Novalytic-Deals` — nhánh `main`, commit `9134af2`

---

## 0. Bối cảnh

| Chỉ số (tháng 8/2026) | Đã dùng | Hạn mức free |
|---|---|---|
| ISR Writes | **232K** | 200K (đã vượt) |
| Fluid Active CPU | 2h26m | 4h |
| Fast Origin Transfer | 2,46 GB | 10 GB |
| Image Optimization | 523 | 5K |

**Quy mô dữ liệu thật** (Supabase `NovalyticDeals_US`): 99 store · 351 coupon · 26 category · 11 deal · 10 event · 9 bài blog → tổng cộng chỉ khoảng **200 trang public**.

Một site 200 trang mà tốn 232K ISR Writes/tháng nghĩa là **mỗi trang bị ghi lại cache hơn 1.000 lần/tháng**. Nội dung không đổi trong tháng 8, nên toàn bộ số này là chi phí lãng phí do cấu hình, không phải do người dùng.

**Phạm vi bản cập nhật này:** bản đầu chỉ nhắm ISR Writes và Fluid CPU. Đã bổ sung thêm mục P2 nhắm trực tiếp vào Fast Origin Transfer và Image Optimization (mục "Bỏ qua tầng Image Optimization"), làm rõ thêm lý do P1 cũng là đòn bẩy CPU lớn (jsdom), và thêm hai hướng nâng cao tuỳ chọn (mục 2b) kèm bảng Được/Mất cho từng hướng — không có mục nào đề xuất bỏ ISR, toàn bộ vẫn giữ `revalidate: false` ở tầng page.

---

## 1. Trả lời câu hỏi: cái poll 20 giây đó để làm gì?

**File:** `components/admin/AccountStatusWatcher.tsx` → mount trong `components/admin/AdminShell.tsx`

### Nó giải quyết vấn đề gì

Session admin của bạn dùng **JWT** (`auth.config.ts`), không phải database session. Đặc điểm của JWT: sau khi đăng nhập, token được ký và lưu ở cookie trình duyệt — **server không hỏi lại database ở mỗi request nữa**. Nó chỉ verify chữ ký.

Hệ quả: nếu bạn vào `/admin/users` và khoá tài khoản của một editor, thì:

- Trong database, `status` của người đó đã thành `INACTIVE` ngay lập tức.
- Nhưng nếu người đó **đang mở sẵn tab admin**, cookie JWT của họ vẫn hợp lệ và vẫn ký đúng. Họ vẫn tiếp tục thao tác bình thường cho tới khi token hết hạn (mặc định NextAuth là 30 ngày).

`AccountStatusWatcher` bịt đúng lỗ hổng đó: cứ 20 giây nó gọi `/api/admin/session/status`, route này đọc `status` thật từ DB. Nếu tài khoản đã bị deactivate hoặc xoá, nó khoá UI bằng một dialog không tắt được và tự động `signOut()` sau 8 giây.

**Kết luận: đây là một tính năng bảo mật thật, không phải code thừa.** Không được xoá nó.

### Nhưng 20 giây là quá dày

Vấn đề nằm ở tần suất, không nằm ở mục đích:

- Một tab admin mở suốt ngày = **4.320 request/ngày**, mỗi request đều chạy middleware + serverless function + query Postgres.
- Route gọi `getUserActiveStatus()` (`lib/data/users.ts:47`), vốn bọc trong `unstable_cache` với `revalidate: 30`. Poll 20s đập vào cache TTL 30s ⇒ **cache bị ghi lại mỗi 30 giây** ⇒ ~2.880 ISR Writes/ngày ⇒ **~86K/tháng**, tức khoảng **43% hạn mức free 200K/tháng** (tương đương ~37% của 232K đã dùng thực tế), chỉ để trả lời "tài khoản của tôi còn hoạt động không".
- Bằng chứng trong log runtime (giờ UTC), chạy liên tục kể cả khi web không có khách:

```
08:44:46  GET /api/admin/session/status  200  cache=MISS
08:45:06  GET /api/admin/session/status  200  cache=MISS
08:45:26  GET /api/admin/session/status  200  cache=MISS
08:45:46  GET /api/admin/session/status  200  cache=MISS
...  (đều đặn ~20s/lần)
```

### Vì sao không cần poll theo chu kỳ mà vẫn logout tức thời

`updateUserStatus()` (`lib/data/users.ts:183`) và `deleteUser()` (`:202`) **đã gọi `purgeTag` cho tag `user-status:<id>`** ngay khi khoá/xoá — nghĩa là server biết chính xác thời điểm cần báo cho client, không cần client tự đoán bằng cách hỏi lại mỗi 20 giây. Thay vì poll (client tự hỏi theo chu kỳ, tốn request kể cả khi không có gì đổi), đổi sang push (server chủ động báo đúng lúc có chuyện) qua **Supabase Realtime** — hạ tầng WebSocket đã có sẵn trong stack (`@supabase/supabase-js` đã là dependency, dùng cho `lib/server/storage/supabaseStorage.ts`).

Cơ chế: ngay tại chỗ `purgeTag` đang chạy, bắn thêm một broadcast message vào kênh riêng của đúng người dùng đó (`user-status:<id>`). Client giữ một kết nối WebSocket tới Supabase (không đi qua Vercel) lắng nghe đúng kênh của mình; nhận được tín hiệu là gọi lại `/api/admin/session/status` để xác nhận qua DB rồi xử lý y hệt luồng cũ. Route API cũ, dialog khoá màn hình, `signOut()` — tất cả giữ nguyên, chỉ đổi cái kích hoạt.

Vì sao an toàn hơn cả phương án hạ tần suất poll: không còn "cửa sổ chờ" nào cả — tín hiệu tới ngay khi `purgeTag` chạy, không phải chờ tối đa vài phút của chu kỳ poll. Đồng thời vẫn giữ `check()` chạy khi mount và khi tab `focus` lại như lưới an toàn, phòng trường hợp socket bị rớt kết nối đúng lúc có sự kiện.

---

## 2. Danh sách sửa, theo thứ tự ưu tiên

### P0 — Đổi AccountStatusWatcher từ poll sang push (Supabase Realtime Broadcast)

**File mới:** `lib/server/realtime/notifyUserStatus.ts`
**Sửa:** `lib/data/users.ts`, `components/admin/AccountStatusWatcher.tsx`
**Env mới:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key vốn được thiết kế để lộ ra client — không phải rủi ro bảo mật, chỉ là biến môi trường mới cần khai trên Vercel)

**Vì sao dùng Broadcast chứ không phải `postgres_changes`:** app dùng NextAuth (JWT tự ký), không phải Supabase Auth — nên Postgres không có `auth.uid()` để RLS lọc theo người dùng. Nếu bật `postgres_changes` trên bảng `users` mà không có RLS đúng, ai cầm anon key cũng subscribe được thay đổi của toàn bộ user khác. Dùng kênh **Broadcast đặt tên theo id riêng từng người** (`user-status:<id>`) né được vấn đề này hoàn toàn — không cần RLS, không đụng vào hệ auth hiện tại. Payload gửi đi cũng không chứa dữ liệu thật, chỉ là tín hiệu "có thay đổi, đi kiểm tra lại".

**Bước 1 — hàm gửi tín hiệu, chạy với service role key (server-side, môi trường tin cậy):**

```ts
// lib/server/realtime/notifyUserStatus.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function notifyUserStatusChanged(userId: string) {
  await supabaseAdmin.channel(`user-status:${userId}`).send({
    type: "broadcast",
    event: "changed",
    payload: {},
  });
}
```

**Bước 2 — gọi ngay cạnh `purgeTag` đã có** (`lib/data/users.ts:183` và `:202`):

```diff
 export async function updateUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
   ...
   const row = await prisma.user.update({ where: { id }, data: { status } });
   purgeTag(`user-status:${id}`);
+  await notifyUserStatusChanged(id);
   return toAdminUser(row);
 }

 export async function deleteUser(id: string, actingUserId: string): Promise<void> {
   ...
   await prisma.user.delete({ where: { id } });
   purgeTag(`user-status:${id}`);
+  await notifyUserStatusChanged(id);
 }
```

**Bước 3 — client subscribe thay vì `setInterval`** (`AccountStatusWatcher.tsx`):

```diff
+import { createClient } from "@supabase/supabase-js";
+
+const supabase = createClient(
+  process.env.NEXT_PUBLIC_SUPABASE_URL!,
+  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
+);
+
-const POLL_INTERVAL_MS = 20_000;
 const AUTO_LOGOUT_AFTER_MS = 8_000;
```

```diff
   useEffect(() => {
     let cancelled = false;
     async function check() { ... }   // giữ nguyên y hệt — vẫn là nguồn sự thật duy nhất, đọc DB thật

-    check();
-    const interval = setInterval(check, POLL_INTERVAL_MS);
+    check(); // vẫn kiểm tra 1 lần khi mount
+    const channel = supabase
+      .channel(`user-status:${session.user.id}`)
+      .on("broadcast", { event: "changed" }, check) // có tín hiệu là check lại ngay, không chờ chu kỳ nào
+      .subscribe();
     window.addEventListener("focus", check);
     document.addEventListener("visibilitychange", check);

     return () => {
       cancelled = true;
-      clearInterval(interval);
+      supabase.removeChannel(channel);
       window.removeEventListener("focus", check);
       document.removeEventListener("visibilitychange", check);
     };
   }, []);
```

- **Rủi ro:** thêm một điểm có thể lỗi (mất kết nối WebSocket) — nhưng `supabase-js` tự động reconnect, và `check()` khi `focus`/mount vẫn chạy như lưới an toàn nếu đúng lúc socket rớt mà bỏ lỡ tín hiệu.
- **Độ trễ phát hiện:** tức thời — không còn cửa sổ chờ nào (khác với phương án hạ poll xuống 5 phút, vẫn còn độ trễ tối đa 5 phút nếu tab không focus).
- **Chi phí Vercel:** kết nối WebSocket nằm trên hạ tầng Supabase, không sinh function invocation hay ISR Write nào ở phía Vercel. `check()` giờ chỉ chạy khi mount, khi `focus`, và khi có sự kiện thật — từ 4.320 request/ngày xuống còn vài chục, và kết hợp với mục P0 tiếp theo (bỏ TTL 30s), gần như toàn bộ các lần đó là cache HIT, không sinh ISR Write.

---

### P0 — Bỏ cache TTL 30s của `getUserActiveStatus`

**File:** `lib/data/users.ts:47-56`

```diff
 export async function getUserActiveStatus(id: string): Promise<boolean> {
   return unstable_cache(
     async () => {
       const row = await prisma.user.findUnique({ where: { id }, select: { status: true } });
       return row?.status === "ACTIVE";
     },
     [`user-status:${id}`],
-    { tags: [`user-status:${id}`], revalidate: 30 }
+    // revalidate: false — updateUserStatus() và deleteUser() đã purge tag này,
+    // nên cache chỉ cần bị đẩy đi đúng lúc trạng thái đổi. TTL 30s trước đây
+    // khiến entry bị ghi lại mỗi 30 giây suốt ngày (~86K ISR Writes/tháng).
+    { tags: [`user-status:${id}`], revalidate: false }
   )();
 }
```

- **Vì sao `false` tốt hơn là bỏ hẳn `unstable_cache`:** giữ cache thì vẫn tránh được query DB ở mỗi lần poll (lý do ban đầu người ta thêm cache), mà số lần ghi cache tụt về gần 0 vì entry chỉ được ghi lại khi tag bị purge.
- **Rủi ro:** không. Độ trễ phát hiện deactivate còn *nhanh hơn* hiện tại (purge tức thì thay vì chờ tối đa 30s).
- **Tiết kiệm ước tính:** ~2.880 ISR Writes/ngày → gần 0. Riêng hai mục P0 này đã đủ đưa bạn về dưới ngưỡng free.

---

### P1 — Gỡ cửa sổ thời gian 60s làm hỏng `revalidate = false` của trang chủ

Đây là lỗi khiến đợt refactor `perf/isr-writes` của bạn không có tác dụng như mong đợi.

`app/page.tsx` khai báo `export const revalidate = false`, nhưng ngay đầu hàm render nó `await` ba hàm rollover, và ba hàm đó đọc ba setting có `revalidate: 60`. Trong Next.js, **revalidate hiệu lực của một route là giá trị nhỏ nhất giữa config của page và các cache mà nó đọc lúc render** — nên trang chủ thực tế là 60 giây, không phải vĩnh viễn.

Bằng chứng trong log — trang chủ trả về `STALE` dù khai báo `false`:

```
08:49:23  GET /  200  cache=STALE
```

**File:** `lib/data/settings.ts` — dòng 737, 765, 792

```diff
   ["settings:popular-stores"],
-  { tags: ["settings:popular-stores"], revalidate: 60 }
+  { tags: ["settings:popular-stores"], revalidate: false }
```

Làm tương tự cho `settings:deal-refresh` (:765) và `settings:coupon-refresh` (:792).

- **Lưu ý quan trọng:** comment hiện tại trong code nói ba setting này *cố ý* dựa vào cửa sổ 60s, vì hàm gọi chúng (`ensurePopularStoresAutoRollover`, `ensureAutoDealRollover`, `ensureAutoCouponRollover`) chạy bên trong render của trang chủ, nơi không được phép gọi `revalidateTag`. Sau khi đổi sang `false`, cơ chế rollover sẽ **chỉ còn được kích hoạt bởi cron hằng ngày** (`app/api/cron/daily-refresh/route.ts` đã gọi đủ cả ba hàm này rồi và purge sau đó). Bạn cần xác nhận: Auto Popular Stores / Auto Deal / Auto Coupon quay vòng **mỗi ngày một lần** thay vì trong vòng 60 giây sau khi đến hạn — với chu kỳ rollover là hằng tháng và 8 tiếng thì việc này chấp nhận được, nhưng đây là quyết định sản phẩm, không phải kỹ thuật thuần tuý.
- **Nếu bạn muốn rollover chính xác hơn theo giờ:** đổi cron trong `vercel.json` từ `0 3 * * *` sang `0 */8 * * *` (Hobby cho phép cron theo giờ) — vẫn rẻ hơn nhiều so với cửa sổ 60s.

---

### P1 — Rà soát toàn bộ `revalidate: 300` trong `lib/data`

Có **29 entry** đang để `revalidate: 300` và **2 entry** để `86400`. Tất cả đều đã được purge đúng chỗ khi có mutation, nên cửa sổ thời gian là thừa và chính nó kéo các trang `revalidate = false` đi cùng.

**Vì sao mục này quan trọng hơn cho Fluid CPU chứ không chỉ ISR Writes:** ba trong số các trang bị regenerate thừa — `app/store/[slug]/page.tsx`, `app/blog/[slug]/page.tsx`, `app/[slug]/page.tsx` — đều render qua `components/ui/RichHtml.tsx`, dùng `isomorphic-dompurify` (chạy bằng **jsdom** ở server, dựng cả một cây DOM đầy đủ để sanitize HTML). Đây là một trong những thao tác tốn CPU nhất có thể chạy trong serverless function, đắt hơn hẳn render template thông thường. Mỗi lần trang bị generate lại **thừa** (do TTL 300s ở `coupon:${slug}`, `blog:${slug}` bên dưới, dù page khai `revalidate: false`) là một lần tốn CPU nặng thừa, không chỉ là một lần ghi cache thừa. Nói cách khác: dọn mục P1 này giải quyết ISR Writes **và** là đòn bẩy lớn nhất cho Fluid CPU trong toàn bộ danh sách sửa — nên ưu tiên cao hơn P2/P3.

Danh sách đầy đủ cần đổi sang `revalidate: false`:

| File | Dòng | Giá trị hiện tại |
|---|---|---|
| `lib/data/settings.ts` | 73 | 300 |
| `lib/data/settings.ts` | 737, 765, 792 | 60 |
| `lib/data/stores.ts` | 57, 126, 151 | 300 |
| `lib/data/stores.ts` | 162 | 86400 |
| `lib/data/coupons.ts` | 194, 216, 232, 284, 302, 322 | 300 |
| `lib/data/coupons.ts` | 91 | 300 — **xem lưu ý bên dưới** |
| `lib/data/deals.ts` | 50, 81, 234 | 300 |
| `lib/data/categories.ts` | 32, 55, 69, 79 | 300 |
| `lib/data/blog.ts` | 38, 102, 165, 178, 189 | 300 |
| `lib/data/blogTopics.ts` | 24, 34 | 300 |
| `lib/data/events.ts` | 80, 115, 139 | 300 |
| `lib/data/authors.ts` | 34 | 300 |
| `lib/data/redirects.ts` | 54 | 86400 |
| `lib/data/users.ts` | 53 | 30 (đã xử lý ở P0) |

**Lưu ý riêng cho `coupons.ts:85-92` (`ensureCouponsExpired`):** entry này khác bản chất với các entry còn lại — nó không cache dữ liệu để đọc, mà **mượn cửa sổ 300s để định kỳ chạy `expireOverdueCoupons()`** (một `updateMany` tắt các coupon quá hạn). Nếu đổi thành `false`, coupon hết hạn sẽ chỉ được tắt bởi cron hằng ngày. Hai lựa chọn:

- **(a) Khuyến nghị** — xoá hẳn `ensureCouponsExpired` và mọi lời gọi tới nó, giao việc expire cho cron. Đơn giản, rẻ, và độ trễ tối đa 24h là chấp nhận được với coupon.
- **(b) Giữ lại** nhưng nới `revalidate` lên `3600` và chấp nhận ~24 lần ghi/ngày.

**Trước khi đổi hàng loạt, phải kiểm tra:** mỗi tag trong bảng trên đều có ít nhất một `purgeTag` tương ứng ở đường mutation. Chạy để đối chiếu:

```bash
grep -rn "tags: \[" lib/data | grep -o '"[a-z-]*:[a-z-]*"' | sort -u
grep -rn "purgeTag(" lib/data lib/content app/api | sort
```

Tag nào xuất hiện ở lệnh thứ nhất mà không có ở lệnh thứ hai thì **chưa được đổi sang `false`** — nếu không nội dung sẽ đứng im vĩnh viễn cho tới lần cron kế tiếp.

---

### P2 — Tắt prefetch ở các bảng danh sách trong admin

Log cho thấy mỗi lần mở một trang danh sách admin, Next.js prefetch toàn bộ trang sửa của các dòng đang hiển thị — khoảng 20 lần render server trong 2 giây:

```
08:44:35–08:44:36   ~20 × GET /admin/stores/<id>   cache=MISS
```

Mỗi cái là một render động đầy đủ kèm query DB. Không sinh ISR Writes nhưng ăn thẳng vào **Fluid Active CPU**.

Thêm `prefetch={false}` vào `<Link>` trỏ tới trang sửa trong các file sau:

- `components/admin/StoreTable.tsx:663`
- `components/admin/CouponTable.tsx`
- `components/admin/DealTable.tsx`
- `components/admin/CategoryTable.tsx`
- `components/admin/BlogTable.tsx`
- `components/admin/BlogTopicTable.tsx`
- `components/admin/EventTable.tsx`
- `components/admin/AuthorTable.tsx`
- `components/admin/UsersTable.tsx`
- `components/admin/RedirectRuleTable.tsx`
- `components/admin/FooterSettingsForm.tsx`

Ví dụ:

```diff
 <Link
   href={`/admin/stores/${store.id}?from=${encodeURIComponent(currentListUrl)}`}
+  prefetch={false}
   onClick={() =>
```

- **Rủi ro:** click vào nút sửa sẽ chậm hơn khoảng 200–400ms vì không còn nạp trước. Đây là trang admin nội bộ nên đánh đổi này hợp lý.

---

### P2 — Thu hẹp matcher của middleware

**File:** `proxy.ts:53`

Matcher hiện tại `/((?!_next|api).*)` khiến `robots.txt`, `sitemap.xml`, `favicon.ico`, `/images/*.svg` đều kích hoạt một function middleware — và bên trong còn có một lượt `redis.hget()` qua mạng. Log xác nhận:

```
08:49:20  GET /robots.txt  200  [serverless-middleware]
GET /images/hero/home-hero.svg   (có invocation)
```

```diff
 export const config = {
-  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|api).*)"],
+  // Loại thêm mọi đường dẫn có phần mở rộng file (robots.txt, sitemap.xml,
+  // favicon.ico, /images/*.svg…) — chúng là asset tĩnh, không bao giờ khớp
+  // redirect rule, nhưng trước đây vẫn tốn một function invocation + một
+  // lượt redis.hget cho mỗi lượt bot ghé.
+  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|api|.*\\.[\\w]+$).*)"],
 };
```

- **Rủi ro:** nếu trong bảng redirect của bạn có rule nào trỏ từ một đường dẫn **có đuôi mở rộng** (ví dụ `/old-page.html`), rule đó sẽ ngừng hoạt động. Kiểm tra trước bằng:

```sql
select source from redirect_rules where source ~ '\.[a-z0-9]+$';
```

---

### P2 — Bỏ qua tầng Image Optimization của Vercel cho ảnh Cloudinary/Supabase

**File:** `next.config.ts`, mọi nơi dùng `next/image` với ảnh từ `res.cloudinary.com` hoặc `*.supabase.co`

Đây là mục duy nhất trong kế hoạch nhắm trực tiếp vào **Fast Origin Transfer** (2,46GB/10GB) và **Image Optimization** (523/5K) — hai chỉ số hiện chưa có mục sửa nào trong bản kế hoạch trước.

`next.config.ts` đang cho phép `next/image` lấy ảnh từ Cloudinary và Supabase Storage qua `remotePatterns`. Mỗi lần dùng `next/image` bình thường, Vercel sẽ **kéo ảnh gốc về origin của nó, tự resize/encode, rồi mới trả ra** — tính vào cả Image Optimization lẫn Fast Origin Transfer, dù ảnh đó vốn đã nằm trên một CDN khác (Cloudinary) có sẵn khả năng tự resize qua URL.

```diff
 images: {
   remotePatterns: [
     { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
     { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
   ],
+  // Ảnh Cloudinary/Supabase đã có CDN + khả năng resize riêng qua URL —
+  // để Vercel Image Optimization xử lý lại là tốn kép. unoptimized: true
+  // khiến next/image bỏ qua tầng transform của Vercel, trả thẳng URL gốc.
+  unoptimized: true,
 },
```

Với ảnh Cloudinary cụ thể, nên đi xa hơn một bước — dùng transform ngay trong URL thay vì phó mặc kích thước gốc:

```diff
-<Image src={store.logoUrl} width={200} height={200} alt={store.name} />
+<Image
+  src={store.logoUrl.replace("/upload/", "/upload/w_200,h_200,c_fill,f_auto,q_auto/")}
+  width={200}
+  height={200}
+  alt={store.name}
+/>
```

**Được / Mất:**

| | Được | Mất |
|---|---|---|
| Fast Origin Transfer | Giảm rõ rệt — ảnh phục vụ thẳng từ CDN Cloudinary, không còn qua origin Vercel | — |
| Image Optimization | Về gần 0 cho ảnh Cloudinary/Supabase — Vercel không còn transform nữa | Mất khả năng Vercel tự động chọn format tối ưu (AVIF/WebP) theo trình duyệt người xem cho các ảnh này — phải tự thêm `f_auto` vào URL Cloudinary để bù lại (Cloudinary hỗ trợ sẵn, không phải tự viết) |
| Tốc độ tải trang | Không đổi hoặc nhanh hơn — Cloudinary vốn cũng là CDN tối ưu ảnh chuyên dụng | Cần audit lại toàn bộ nơi dùng `<Image>` với ảnh Cloudinary để thêm transform URL thủ công, nếu không ảnh sẽ tải nguyên kích thước gốc (nặng hơn trước) |
| Rủi ro vận hành | — | Ảnh từ nguồn khác ngoài Cloudinary/Supabase (admin dán link Google/Facebook — CSP đã cho phép `img-src https:`) sẽ **không được resize bởi ai cả** một khi tắt Vercel Image Optimization toàn cục; cần cân nhắc chỉ `unoptimized` cho đúng 2 domain đó thay vì tắt toàn bộ, hoặc chấp nhận ảnh dán tay hiển thị nguyên kích thước |

**Khuyến nghị:** áp dụng transform URL Cloudinary trước (an toàn, không đổi hành vi Vercel Image Optimization cho nguồn khác), đo lại Origin Transfer sau 1 tuần; chỉ bật `unoptimized: true` toàn cục nếu vẫn chưa đủ và đã chấp nhận đánh đổi ở dòng cuối bảng trên.

---

### P3 — Cho cron chỉ purge tag nào thực sự thay đổi (tuỳ chọn)

**File:** `app/api/cron/daily-refresh/route.ts`

Hiện tại cron purge vô điều kiện cả 19 tag mỗi ngày lúc 3h sáng UTC:

```ts
for (const tag of KNOWN_CACHE_TAGS) purgeTag(tag);
```

Sau đó toàn bộ ~200 trang public phải render lại từ đầu ở lượt crawl kế tiếp — và sitemap của bạn khai `changeFrequency: "daily"` cho store routes nên bot quay lại rất đều. Đó là một vòng ghi cache đầy đủ mỗi ngày dù không có gì đổi.

Cách sửa: cho `expireOverdueCoupons()` và các hàm rollover trả về số bản ghi đã đổi, rồi chỉ purge tag tương ứng khi con số đó khác 0.

- **Đánh đổi:** vòng purge toàn bộ hiện đang đóng vai trò **lưới an toàn** cho những đường đọc không mang tag riêng (comment trong file có nhắc `getRelatedStores`). Sau khi chuyển hàng loạt sang `revalidate: false` ở P1, lưới an toàn này càng quan trọng hơn. **Khuyến nghị: để nguyên P3 cho tới khi P0/P1 đã chạy ổn định vài tuần** và bạn xác nhận không có trang nào bị đứng nội dung.

---

## 2b. Hai hướng nâng cao (tuỳ chọn — đổi kiến trúc, không phải sửa lỗi)

Khác với các mục P0–P3 ở trên (đều là "cấu hình sai, sửa lại cho đúng"), hai mục dưới đây là **đổi cách vận hành**, không bắt buộc để về dưới hạn mức free — P0+P1 đã đủ cho việc đó. Chỉ nên làm nếu bạn chấp nhận đánh đổi được nêu rõ trong từng mục.

### Nâng cao A — Chuyển redirect từ Redis + middleware sang Vercel Redirects gốc

**File:** `proxy.ts`, thêm mới một bước gọi Vercel API khi admin thêm/sửa redirect rule

Hiện tại (kể cả sau khi làm xong mục P2 "Thu hẹp matcher"), mọi request công khai không có đuôi file vẫn phải chạy qua middleware để tra `redis.hget("redirects:active", pathname)`. Vercel có tính năng Redirects quản lý ở **tầng network** (`vercel redirects upload` / REST API) — xử lý redirect **trước khi chạm tới bất kỳ function nào**, không tốn CPU hay origin transfer.

Cách làm: khi admin lưu một redirect rule, ngoài việc ghi vào Redis như hiện tại (giữ lại để admin UI đọc/hiển thị danh sách), gọi thêm Vercel API để đẩy toàn bộ danh sách redirect hiện tại lên tầng network. Sau đó gỡ hẳn đoạn tra Redis trong `proxy.ts` khỏi luồng request công khai.

**Được / Mất:**

| | Được | Mất |
|---|---|---|
| Fluid CPU | Toàn bộ request công khai không redirect còn lại không tốn CPU tra cứu redirect nữa (dù đã thu hẹp matcher ở P2, phần còn khớp matcher vẫn phải tra Redis) | — |
| Độ phức tạp | — | Thêm một bước đồng bộ (gọi Vercel API) mỗi lần admin sửa redirect — nếu bước này lỗi mà không xử lý, danh sách redirect trên Vercel và trong Redis/UI admin có thể lệch nhau |
| Độ trễ áp dụng | — | Redirect qua Vercel API cần deploy lại cấu hình network, có thể mất vài chục giây tới vài phút để có hiệu lực — chậm hơn Redis (tức thời) |
| Vận hành | — | Cần theo dõi thêm một điểm tích hợp mới (Vercel API key/permission), thêm bề mặt có thể lỗi |

**Khuyến nghị:** chỉ làm nếu số lượng redirect rule của bạn lớn và tần suất truy cập công khai cao — với quy mô hiện tại (200 trang, ~100 request/tuần), phần CPU tiết kiệm được ở đây rất nhỏ so với công sức bỏ ra. Ưu tiên thấp hơn hẳn P0–P2.

### Nâng cao B — Chuyển `expireOverdueCoupons()` sang chạy bằng `pg_cron` trong Postgres

**Hạ tầng:** extension `pg_cron` đã có sẵn trên Supabase project `NovalyticDeals_US` (`default_version: 1.6.4`), hiện chưa bật.

Thay vì để route `app/api/cron/daily-refresh` gọi `expireOverdueCoupons()` (một `updateMany` tắt coupon hết hạn), có thể giao việc này thẳng cho `pg_cron` chạy trong Postgres:

```sql
select cron.schedule(
  'expire-overdue-coupons',
  '0 3 * * *',
  $$ update coupons set "isActive" = false, "isFeatured" = false, "isTrending" = false
     where "isActive" = true and "expiresAt" < now() $$
);
```

**Được / Mất:**

| | Được | Mất |
|---|---|---|
| Fluid CPU | Bớt một bước xử lý trong route cron trên Vercel (dù không lớn — chỉ là 1 `updateMany`) | — |
| Chi phí | `pg_cron` nằm trong gói Postgres đã trả, không phát sinh chi phí mới | — |
| Cache | — | `pg_cron` chỉ đổi dữ liệu trong DB, **không tự purge cache của Vercel**. Route cron hiện tại gọi `expireOverdueCoupons()` rồi mới `purgeTag` — nếu tách việc expire ra khỏi route, phải tự thêm một cơ chế purge riêng (ví dụ route cron vẫn chạy nhưng chỉ để purge, không expire), nếu không tag `coupons:list` sẽ không được purge đúng lúc coupon hết hạn |
| Khả năng quan sát | — | Lỗi trong `pg_cron` job khó thấy hơn — không hiện trong Vercel Logs như route handler, phải tra `cron.job_run_details` trong Postgres |
| Độ phức tạp | — | Thêm một nơi định nghĩa logic nghiệp vụ (SQL trong Supabase) tách biệt khỏi codebase chính — người sau vào code dễ bỏ sót khi tìm hiểu luồng expire coupon |

**Khuyến nghị:** lợi ích CPU ở đây rất nhỏ so với rủi ro vận hành (đặc biệt là việc cache không tự purge). **Không ưu tiên** — chỉ cân nhắc nếu route cron của bạn sau này phình to và thời gian chạy trở thành vấn đề thật sự.

---

## 3. Thứ tự triển khai đề xuất

```
Nhánh 1: perf/admin-realtime     →  P0 (3 file mới/sửa + 2 biến env) — deploy trước, test kỹ luồng khoá/xoá tài khoản
Nhánh 2: perf/cache-ttl          →  P0 (users.ts) + P1 (settings 60s trước, rồi 300s sau khi rà purge) — ưu tiên cao nhất cho CPU (jsdom)
Nhánh 3: perf/admin-prefetch     →  P2 (prefetch + matcher middleware)
Nhánh 4: perf/image-offload      →  P2 (Cloudinary/Supabase transform URL trước, unoptimized sau khi đo lại)
Sau 2–4 tuần                     →  cân nhắc P3
Không ưu tiên trừ khi cần         →  2b (native Redirects, pg_cron) — chỉ làm nếu đã đọc kỹ bảng Được/Mất và chấp nhận đánh đổi
```

Không gộp tất cả vào một lần deploy: nếu cache bị đứng ở đâu đó, bạn sẽ không biết nhánh nào gây ra. Riêng Nhánh 1 nên test thủ công trước khi lên production: mở 2 trình duyệt (hoặc 1 ẩn danh) đăng nhập 2 tài khoản khác nhau, dùng tài khoản A khoá tài khoản B, xác nhận tab B bị logout gần như ngay lập tức chứ không cần reload. Nhánh 4 nên test riêng: mở lại một trang store bất kỳ, kiểm tra ảnh logo/banner vẫn hiển thị đúng và không bị vỡ/nặng bất thường trước khi đổi tiếp trang khác.

---

## 4. Cách kiểm chứng sau khi deploy

### Ngay sau khi lên (5–10 phút)

```bash
# Số dòng phải giảm mạnh — chỉ còn xuất hiện quanh lúc mount/focus/deactivate
# thật, không còn đều đặn mỗi ~20 giây nữa
vercel logs --follow | grep "session/status"
```

Hoặc trên dashboard: **Project → Logs**, lọc `session/status`. Đồng thời mở DevTools ở tab admin đang mở, tab **Network → WS**, xác nhận có một kết nối WebSocket tới `*.supabase.co` đang ở trạng thái `101 Switching Protocols` (đang mở), không phải liên tục có request HTTP mới.

### Sau 24 giờ

Vào **Usage → ISR Writes**, so sánh mức tăng theo ngày với đường cơ sở hiện tại (~7.700 writes/ngày). Kỳ vọng:

| Sau bước | ISR Writes/ngày kỳ vọng |
|---|---|
| Hiện tại | ~7.700 |
| Sau P0 (Realtime + bỏ TTL 30s) | ~4.800 |
| Sau P1 | dưới ~1.500 |

### Kiểm tra cache thật sự "dính"

```bash
curl -sI https://<domain-cua-ban>/ | grep -i x-vercel-cache
```

Gọi hai lần cách nhau 2 phút. Sau P1, lần thứ hai phải trả về `HIT`, **không được là `STALE`**. Nếu vẫn `STALE` thì còn sót một `unstable_cache` có TTL nằm trong đường render của trang chủ.

### Kiểm tra nội dung không bị đứng

Sau khi chuyển sang `revalidate: false`, thử: sửa tên một store trong admin → reload trang `/store/<slug>` → tên phải đổi trong vòng vài giây. Nếu không đổi, tag của đường đọc đó chưa được purge — quay lại lệnh `grep` đối chiếu ở phần P1.

---

## 5. Tóm tắt một dòng

Hơn một phần ba hạn mức ISR Writes của bạn đang bị đốt bởi một vòng poll bảo mật 20 giây trong admin đập vào một cache TTL 30 giây — cả hai đều thừa vì đường mutation đã purge tag đúng lúc, chỉ cần server chủ động báo (Supabase Realtime) thay vì để client tự hỏi theo chu kỳ. Phần còn lại đến từ việc `revalidate = false` trên các trang public bị vô hiệu hoá bởi các cửa sổ 60s/300s ở tầng `unstable_cache` bên dưới — dọn đúng chỗ này còn cắt luôn phần CPU nặng nhất (jsdom sanitize HTML). Sửa P0 + P1 là đủ về dưới ngưỡng free cho cả ISR Writes lẫn phần lớn CPU; P2 (ảnh, prefetch, middleware) dọn nốt phần còn lại kể cả Origin Transfer. Hai hướng ở mục 2b là tuỳ chọn, đánh đổi nhiều hơn lợi ích ở quy mô hiện tại — không cần làm trừ khi bạn đã đọc và chấp nhận bảng Được/Mất tương ứng.
