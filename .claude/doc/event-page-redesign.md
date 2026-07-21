# Event Page Redesign — Tóm tắt session

## 1. Mục tiêu
Chỉnh sửa trang Event chi tiết (`/events/[slug]`): dọn hero (bỏ chữ bake trong ảnh banner, bỏ countdown, tăng size khớp trang Deals), đổi layout Featured stores + Curated deals theo pattern đã có sẵn trong codebase, và thêm FAQ dùng chung template cho mọi event.

## 2. Những phần đã hoàn thành

**Hero (`app/events/[slug]/page.tsx`)**
- Xóa `<text>` bake tên event trong 10 file SVG banner thật `public/images/events/*.svg` (black-friday, boxing-day, christmas, cyber-monday, easter, fathers-day, halloween, mothers-day, thanksgiving, valentines-day) — chỉ giữ gradient nền + 2 vòng tròn mờ trang trí. (`public/images/anh/a12.png` chỉ là ảnh tham khảo user gửi, không được reference ở đâu trong code nên không đụng vào)
- Xóa `<CountdownTimer endsAt={...}>` khỏi hero + xóa hẳn file `components/event/CountdownTimer.tsx` (không còn nơi nào import sau khi bỏ)
- Container hero: `py-14 sm:py-20`, `h1`: `text-4xl sm:text-5xl` — khớp `components/deal/DealsHero.tsx`

**Featured stores**
- Tái dùng component có sẵn `components/store/StoreGrid.tsx` (5 cột × 3 hàng = 15 store, nút "View All" căn giữa khi có nhiều hơn)
- Trang mới `app/events/[slug]/stores/page.tsx` — "View All" trỏ tới đây
- Component mới `components/event/EventStoresGrid.tsx` (mirror `components/store/CategoryStoresGrid.tsx`, bỏ `AlphabetNav`) — grid 5 cột × 10 hàng (50 store/lần), nút "Show more" client-side (`useState`, không reload trang) căn giữa, tải thêm 50 mỗi lần bấm
- Đổi cách tính `verifiedCouponCountByStore`: dùng hàm có sẵn `getVerifiedCouponCountByStoreIds` (`lib/data/coupons.ts`, đếm toàn bộ coupon verified của store) thay cho việc đếm thủ công chỉ trong tập coupon curated của event — nhất quán với cách trang Category đang làm

**Curated deals**
- Đổi từ `CouponCard` (dạng hàng ngang) sang `CouponGridCard` (dạng thẻ lưới — logo tròn, badge giảm giá, Verified, tên store, tiêu đề, nút "Show Code", đúng mẫu thiết kế user cung cấp)
- Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`, giới hạn `CURATED_DEALS_LIMIT = 20` (tối đa 4 hàng ở breakpoint 5 cột)

**FAQ (mới — template dùng chung cho mọi event, không phải field riêng từng event)**
- `types/settings.ts`: thêm `eventFaqTemplate?: StoreFaqTemplateItem[]` vào `ContentConfigTemplates`
- `lib/validators/admin/settings.ts`: thêm `eventFaqTemplate: z.array(storeFaqItemSchema).optional()` vào `adminContentConfigSettingsSchema`
- `lib/content/defaults.ts`: hàm mới `resolveEventFaq(eventName: string)` — áp `eventFaqTemplate` với `{name}` thay bằng tên event qua `applyTemplate` (dùng chung helper `lib/content/template.ts` đã có). Event **không có** field `faq` riêng trong DB/Prisma (khác Store/Category) — 100% dùng 1 template site-wide
- `components/admin/ContentConfigSettingsForm.tsx`: thêm tab "Event Templates" với field-array editor (`useFieldArray`) y hệt pattern "Store — FAQ template" đã có, cho phép admin sửa 5 câu FAQ này qua UI
- `app/events/[slug]/page.tsx`: gọi `resolveEventFaq(event.name)`, render `<FAQAccordion items={faq} />` bên dưới Curated deals + JSON-LD `<JsonLd data={faqPageJsonLd(faq)} />` cho SEO (dùng lại `lib/seo/jsonld.ts`, `lib/seo/JsonLdScript.tsx` đã có)
- Đã seed trực tiếp vào DB (bảng `SiteSetting`, key `content_config`, field `templates.eventFaqTemplate`) 5 câu hỏi/trả lời mặc định bằng tiếng Anh (câu trả lời 3-4 câu mỗi câu) qua script `tsx` chạy tạm (không lưu trong repo) — admin có thể chỉnh lại nội dung qua tab mới trong Settings

## 3. Trạng thái hiện tại
- Dev server chạy ổn định tại `http://localhost:3000` (`npm run dev`)
- Đã verify qua `curl` + đọc HTML SSR: `/`, `/events/christmas`, `/events/christmas/stores` đều trả 200; FAQ hiển thị đúng nội dung với `{name}` → "Christmas"; Featured stores/Curated deals render đúng grid mới
- `npm run typecheck` và `npm run lint` sạch — chỉ còn 1 warning pre-existing không liên quan (`lib/server/affiliate/redirect.ts:6`, biến `_store` không dùng)
- Trong lúc test, phát hiện và xử lý một lần race-condition do Next.js data cache (`unstable_cache`, tag `settings:content-config`) của dev server cũ giữ giá trị rỗng sau khi ghi DB trực tiếp (không qua `setContentConfigSettings`/`purgeTag`) — đã fix bằng cách xóa `.next/cache` + restart; không phải vấn đề ở code, chỉ là cache cũ của session dev trước đó

## 4. Bước tiếp theo
- Test trực quan trên trình duyệt thật (chưa test qua UI, mới verify qua curl HTML SSR): nút "View All"/"Show more", accordion FAQ mở/đóng, responsive mobile
- Chưa có event thực tế nào có >15 store hoặc >20 coupon curated để test trực quan trạng thái "View All"/giới hạn 4 hàng
- Chưa có event thực tế nào có >50 store để test nút "Show more" trên trang `/events/[slug]/stores`
- Cân nhắc: hiện tại FAQ 100% dùng chung 1 template cho mọi event (không có override riêng từng event như Store/Category) — nếu sau này cần tùy biến câu hỏi riêng cho một event cụ thể (vd Black Friday khác Valentine's Day) thì cần thêm field `faq` riêng vào Event (migration Prisma + admin form), hiện chưa làm vì user yêu cầu rõ "dùng cấu trúc template để viết cho tất cả event"
- File script `tsx` dùng để seed `eventFaqTemplate` vào DB chỉ chạy tạm một lần, không có trong repo — nếu muốn nội dung này persist khi seed lại DB từ đầu (`prisma db seed`), cần thêm vào `prisma/seed.ts` chính thức
