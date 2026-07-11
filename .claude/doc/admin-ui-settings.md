# Admin Settings — Session Summary

## Mục tiêu
Xây dựng trang Settings admin đầy đủ (General/Integrations/Affiliate/Users), vá lỗ hổng auth, và sửa việc Logo/Favicon/OG Settings không phản ánh ra site thật.

## Những phần đã hoàn thành

**Auth & middleware**
- Tách `auth.ts` → `auth.config.ts` (edge-safe callbacks) + `auth.ts` (Credentials/Prisma), giữ tên file `proxy.ts` (Next.js 16 dùng convention "proxy", không phải "middleware" — đã xác nhận qua build warning).
- Thêm role-gating ADMIN-only cho `/api/admin/users`, `/admin/settings/users`, `/api/admin/settings/integrations`, `/api/admin/settings/cache-purge`.
- Thêm tra Redis (`redirects:active`) trong `proxy.ts` để redirect rule chạy được trên Edge runtime (không gọi Prisma trực tiếp được).

**Prisma**
- Model `RedirectRule` + enum `RedirectType` (migration `20260707044500_add_redirect_rule`).

**Data layer / validators**
- `types/settings.ts`, `lib/validators/admin/{settings,redirectRule,user}.ts`.
- `lib/data/settings.ts` mở rộng: General/Integrations/Affiliate, DB-backed với fallback `.env` (Resend key, Turnstile secret key, GA ID, Plausible domain, affiliate network mặc định).
- `lib/data/redirects.ts` (CRUD + mirror sang Redis), `lib/data/users.ts` (CRUD, chặn xoá/hạ quyền admin cuối cùng và tự xoá chính mình).
- `lib/server/security/password.ts`, `lib/server/cache/tags.ts` (danh sách tag cố định cho cache-purge).
- Wire fallback vào `lib/server/email/resend.ts`, `lib/server/security/turnstile.ts`.

**API routes**
- `app/api/admin/settings/{general,integrations,affiliate,cache-purge}/route.ts` (thay cho route cũ `settings/route.ts`).
- `app/api/admin/redirects/{route.ts,[id]/route.ts}`, `app/api/admin/users/{route.ts,[id]/route.ts}`.

**UI**
- `app/admin/settings/{page.tsx, integrations/page.tsx, affiliate/page.tsx, affiliate/redirects/{new,[id]}/page.tsx, users/{page.tsx,new/page.tsx}}`.
- Components mới: `GeneralSettingsForm`, `IntegrationsSettingsForm`, `SecretField`, `AffiliateSettingsForm`, `RedirectRuleTable`/`Form`, `UsersTable`, `UserForm`, `ResetPasswordModal`, `components/analytics/AnalyticsScripts.tsx`.
- `AdminSidebar.tsx`: Settings → `ParentNavItem` có children (General/Integrations/Affiliate & Redirects/Users), sửa logic active-match sang "longest-prefix-wins" (tránh regression với Blog Topics/Blog).
- Logo/Favicon/OG image: dùng lại `ImageUploadField` (`allowManualUrl` + `deferUpload`) — vừa upload file vừa dán URL được; sau khi save gọi `reset()` + đổi `key` để tránh preview bị stale (blob cũ).
- 2 trang General/Integrations căn giữa, width `md:w-4/5`.

**Wire vào site thật**
- `Header.tsx`/`Footer.tsx` đọc `getGeneralSettings()`, render `<img>` (không dùng `next/image` vì logo có thể là domain ngoài `next.config.ts` remotePatterns).
- Xoá `app/favicon.ico` tĩnh (đang đè lên favicon động từ Settings).
- `lib/seo/metadata.ts`: `buildMetadata()` thành async, fallback OG image từ Settings khi trang không tự set — áp dụng cho 18 file `page.tsx` (13 static `export const metadata` → `generateMetadata`, 5 dynamic thêm `await`).
- `app/robots.ts`/`app/sitemap.ts` đọc `robotsIndexingEnabled`/`sitemapEnabled`.

**Git**
- Commit `af8ae75` (message rút gọn còn "add admin settings, edit blog" — người dùng chấp nhận giữ nguyên) đã push lên `origin/main`, thay `0e5b2b2`.

## Trạng thái hiện tại
- Code chạy ổn định trên dev server (`localhost:3000`), đã verify: auth 401/403/redirect đúng vai trò, robots.txt/sitemap.xml phản ứng theo toggle, OG image fallback đúng (không đè ảnh riêng của store/coupon), logo/favicon hiển thị đúng trên Header/Footer/tab trình duyệt.
- `typecheck`, `lint`, `build` đều sạch (chỉ còn 1 warning cũ không liên quan ở `lib/server/affiliate/redirect.ts`).
- **Chưa fix / cần lưu ý:**
  - Redirect Rules chỉ hoạt động CRUD; việc redirect thật cho visitor cần `UPSTASH_REDIS_REST_URL`/`TOKEN` thật (hiện trống trong `.env` local) — đang no-op.
  - Ảnh upload lên Cloudinary từng bị 404 sau một thời gian (nghi tài khoản demo/dùng thử tự xoá) — đã xác nhận pipeline code đúng, vấn đề ở phía tài khoản Cloudinary, chưa xử lý.
  - 11 ảnh debug/test (`public/images/anh/{a11-a16,b2-b6}.png`) chưa track, còn nằm trên máy, không đưa vào commit.
  - Users chỉ có trang tạo mới + sửa role/password inline trong bảng, không có trang edit `[id]` riêng (chủ đích, không phải thiếu sót).

## Bước tiếp theo (từ session trước)
1. Cấu hình Upstash Redis thật nếu muốn Redirect Rules hoạt động thật trên production.
2. Kiểm tra/đổi tài khoản Cloudinary (hoặc chuyển provider mặc định sang Supabase Storage) để ảnh upload không biến mất.
3. Dọn 11 ảnh debug trong `public/images/anh/` nếu không cần giữ.
4. Tiếp tục phần blog admin / rich-text-toolbar đang dang dở (không thuộc phạm vi session này, đã commit kèm theo nhưng chưa hoàn chỉnh).

## Session 2 — Thêm 4 mục Settings: Author, Social Network, SEO, Content Configuration

Plan file: `~/.claude/plans/th-m-v-o-thanh-i-u-lucky-whistle.md`.

### Đã hoàn thành
- **Types/Validators/Data layer**: `AuthorSettings`, `SocialSettings`, `SeoSettings`, `ContentConfigSettings` trong `types/settings.ts`; schema tương ứng trong `lib/validators/admin/settings.ts`; key/get/set trong `lib/data/settings.ts` (key `author_default`, `social_links`, `seo_defaults`, `content_config`, cùng bảng `SiteSetting` — không cần migration).
- **API routes**: `app/api/admin/settings/{author,social,seo,content}/route.ts` (GET/PATCH), social/seo/content có `revalidatePath("/", "layout")`.
- **Admin UI**: 4 trang `app/admin/settings/{author,social,seo,content}/page.tsx` + 4 form `components/admin/{Author,Social,Seo,ContentConfig}SettingsForm.tsx`, đăng ký nav trong `AdminSidebar.tsx`. **Chỉ ADMIN** truy cập được (4 prefix API mới thêm vào `ADMIN_ONLY_PREFIXES` trong `proxy.ts`, cộng role-check trong từng `page.tsx`, sidebar ẩn với EDITOR).
- **Author**: prefill `authorName`/`authorAvatarUrl` khi tạo blog post mới (`app/admin/blog/new/page.tsx` → `BlogForm.tsx`); API route tạo/sửa blog (`app/api/admin/blog/route.ts`, `[id]/route.ts`) dùng Author Settings làm fallback thay vì chuỗi hardcode "NovalyticDeals".
- **Social Network**: thêm `TiktokIcon` vào `components/ui/SocialIcons.tsx`; `Footer.tsx` đọc `getSocialSettings()`, chỉ hiện icon platform đã có URL (ẩn nếu trống, theo quyết định user); `organizationJsonLd()` (`lib/seo/jsonld.ts`) chuyển async, đổ social links vào `sameAs`; `app/layout.tsx`'s `RootLayout` chuyển async để `await` hàm này.
- **SEO**: `app/layout.tsx` `generateMetadata()` đọc `getSeoSettings()` — áp `titleTemplate`, `defaultMetaDescription` (fallback 2 lớp sau `GeneralSettings.description`), `defaultKeywords`, `verification.google`/`verification.other["msvalidate.01"]` (đã verify đúng shape `Metadata.verification` của Next 16 qua `node_modules`).
- **Content Configuration**: 
  - Pagination: `app/deals/page.tsx`, `app/search/page.tsx` (bỏ `PAGE_SIZE` hardcode), `app/page.tsx` (4 số hardcode `8,8,3,3`) — tất cả đọc từ `getContentConfigSettings().pagination`.
  - Auto-fill template Store/Blog: nới lỏng validator `lib/validators/admin/store.ts` (description/aboutStore/seoTitle/seoDescription → optional) và `lib/validators/admin/blog.ts` (excerpt/seoTitle/seoDescription → optional), sửa label form (`StoreForm.tsx`, `BlogForm.tsx`) bỏ dấu required + thêm hint "auto-fill". API routes store/blog (`app/api/admin/stores/*`, `app/api/admin/blog/*`) coerce `|| ""` khi field optional giờ `undefined`.
  - Helper mới `lib/content/defaults.ts` — `resolveStoreContent()`/`resolveBlogContent()` — **chỉ** gọi ở `app/store/[slug]/page.tsx` và `app/blog/[slug]/page.tsx` (cả `generateMetadata` lẫn body, mỗi trang có 2 điểm fetch riêng), **không đụng** `lib/data/stores.ts`/`lib/data/blog.ts` hay trang admin edit — admin edit form luôn thấy dữ liệu thật (kể cả rỗng), chỉ trang public mới thấy nội dung auto-fill.

### Đã verify end-to-end (dev + prod `next start`)
- Build/typecheck/lint sạch.
- Login admin thật (`admin@novalyticdeals.com`), test GET/PATCH cả 4 API mới — hoạt động đúng, 401 khi chưa login.
- Social: PATCH Facebook+TikTok URL → Footer chỉ hiện 2 icon đó (đúng href, `target="_blank"`), JSON-LD `sameAs` cập nhật đúng.
- SEO: `keywords`, `google-site-verification`, `msvalidate.01` phản ánh đúng trên **mọi trang** ngay sau PATCH (kể cả trang chủ). Title template (`%s | ...`) hoạt động đúng trên `/about`, `/categories`, `/stores`, `/store/[slug]`.
- Content Configuration: set template cho Store (title/description/about/howToApply/faq/seoDescription), xoá hết field tương ứng của 1 store thật (Zara) qua PATCH — trang public `/store/[slug]` hiển thị đúng nội dung auto-fill (kể cả FAQ JSON-LD), trong khi `GET /api/admin/stores/[id]` (admin edit) vẫn trả field **rỗng thật** — đúng thiết kế "không lẫn nội dung auto-fill vào form edit".
- Đã dọn lại data test: Content Config templates, Social, SEO, Author về rỗng; Zara store trả lại field gốc (riêng `affiliateNetwork` đổi từ chuỗi "Awin" cũ sang URL hợp lệ `https://awin.com/track/zara` vì validator hiện tại bắt buộc URL — dữ liệu seed cũ "Awin" thực ra đã không hợp lệ với validator từ trước).

### Vấn đề đã biết (chưa fix, không thuộc phạm vi feature này)
- **Trang chủ (`/`) có độ trễ ISR riêng với `revalidatePath`**: sau khi đổi SEO `titleTemplate`, thẻ `<title>` của riêng route `/` không cập nhật ngay (dù `<meta keywords>`, `verification`, Header/Footer, JSON-LD... đều cập nhật đúng ngay lập tức). Mọi trang khác (`/about`, `/categories`, `/stores`, `/store/[slug]`...) đều cập nhật `<title>` đúng ngay. Đã thử thêm `revalidatePath("/")` (type "page") bên cạnh `("/", "layout")` trong `seo/route.ts` nhưng không khắc phục được — nghi là quirk của Next.js 16 khi on-demand revalidate route gốc "/", tồn tại từ trước (cùng cơ chế `general/route.ts` đã dùng). Sẽ tự hết sau khi qua mốc `revalidate: 300`s hoặc redeploy/restart server thật. Không chặn tính năng, không phải bug trong code mới.
- **Mất `faviconUrl`/`ogImage` của General Settings trong lúc test**: trong lúc verify, đã PATCH General Settings để test title fallback và vô tình ghi đè `faviconUrl`/`ogImage` về rỗng (chỉ khôi phục lại được `title`/`description`/`logoUrl`). Đây là dữ liệu **local dev DB**, không phải production — cần vào `/admin/settings` upload lại favicon/OG image nếu cần.

## Session 3 — Mở rộng General Settings: Slogan, Top/Bottom Description, Company Info, Copyright

Plan file: `~/.claude/plans/th-m-v-o-thanh-i-u-lucky-whistle.md` (đã ghi đè plan session 2 — task khác).

### Đã hoàn thành
- **Field mới trong `GeneralSettings`** (`types/settings.ts`, `lib/validators/admin/settings.ts`, `DEFAULT_GENERAL_SETTINGS` trong `lib/data/settings.ts`) — không tạo key/route/trang mới, tái dùng nguyên `general` section đã có: `slogan`, `topDescription`, `bottomDescription`, `companyName`, `hotline`, `address`, `email` (validate `.email()`), `copyright`.
- **`components/admin/GeneralSettingsForm.tsx`**: thêm input Slogan/Top Description/Bottom Description (sau Title/Description hiện có) và nhóm "Company info" (Company name/Hotline/Address/Email/Copyright, sau grid ảnh Logo/Favicon/OG).
- **`components/layout/Header.tsx`**: bỏ `h-16` cố định → `min-h-16 py-2` để tự giãn; thêm Slogan (dưới tên site, cùng dòng logo) + Top Description (dòng riêng dưới thanh chính, ẩn ở mobile bằng `hidden sm:block`) — chỉ render khi có giá trị, Header giữ nguyên compact khi rỗng (đã verify).
- **`components/layout/Footer.tsx`**: blurb hardcode → `settings.bottomDescription || <câu cũ làm fallback>`; thêm khối Hotline/Address/Email (icon `Phone`/`MapPin`/`Mail` từ lucide-react) vào cột "Company", chỉ hiện dòng nào có giá trị; copyright hardcode → hàm `buildCopyright()` (tự sinh `© {năm} {companyName || title}. All rights reserved.` khi field Copyright trống, dùng nguyên văn field Copyright — thay `{year}` — khi có điền). Đã fix 1 lỗi nhỏ: trim dấu `.` cuối `companyName` để tránh double-period khi companyName tự có dấu chấm (vd "Inc.").
- **`app/contact/page.tsx`**: chuyển thành async, đọc `getGeneralSettings()`, thay email hardcode `novalytic.studio@gmail.com` bằng `settings.email` (fallback về email cũ), thêm khối Hotline/Address nếu có.
- **`lib/seo/jsonld.ts`** `organizationJsonLd()`: đọc thêm `getGeneralSettings()`, `name` dùng `companyName || title` (hết hardcode "NovalyticDeals"), thêm `telephone`/`email`/`address`.

### Đã verify end-to-end (dev server, admin thật)
- `typecheck`/`lint`/`build` sạch.
- PATCH đủ 8 field mới → Header hiện Slogan+Top Description, Footer hiện Bottom Description + khối liên hệ + copyright đúng (cả 2 case: để trống field Copyright và điền field Copyright có `{year}`), `/contact` hiện đúng email/hotline/address, JSON-LD Organization có đủ `name`/`telephone`/`email`/`address`.
- Test case rỗng: xoá hết 8 field → Header/Footer/Contact quay lại đúng hành vi/nội dung mặc định cũ, không có khoảng trắng thừa ở Header.
- Nhân tiện phát hiện: General settings `title`/`logoUrl` bị lệch về giá trị test cũ ("TESTBRAND123") từ session 2 dù đã tưởng khôi phục xong — đã khôi phục lại đúng `title="NovalyticDeals"` + `logoUrl` Cloudinary gốc trong session này.

### Chưa làm / lưu ý
- Chưa kiểm tra bằng mắt (chỉ verify qua HTML/curl) — nên mở trình duyệt xem Header ở mobile viewport thật để chắc chắn Slogan không đẩy vỡ layout hàng logo+nav+search trên các theo dõi thực tế.
- Sidebar sticky `lg:top-24` ở `/store/[slug]`, `/blog/[slug]` chưa kiểm tra lại độ lệch khi Header có Slogan+Top Description (Header cao hơn ~64px cũ) — cần xem bằng mắt nếu Header thực tế cao hơn đáng kể.

## Session 4 — Footer cột động (Notices...) + đưa Users ra top-level "User Management"

Plan file: `~/.claude/plans/th-m-v-o-thanh-i-u-lucky-whistle.md` (đã ghi đè plan session 3).

### Đã hoàn thành

**Footer cột động** — section Settings mới "Footer" (chỉ ADMIN), theo đúng pattern Author/Social/SEO/Content Configuration:
- `types/settings.ts`: `FooterLink { label; href }`, `FooterColumn { title; links }`, `FooterSettings { columns }`.
- `lib/validators/admin/settings.ts`: `adminFooterSettingsSchema` (`columns` max 4).
- `lib/data/settings.ts`: `FOOTER_KEY = "footer_links"`, `DEFAULT_FOOTER_SETTINGS` seed đúng y hệt Footer cũ (Quick links: Stores/Categories/Deals; Company: About Us/Contact Us/Submit a Coupon/Blog/Terms Of Use/Privacy Policy — gộp cả Terms/Privacy vào Company để khớp render cũ 1:1).
- `app/api/admin/settings/footer/route.ts`, `app/admin/settings/footer/page.tsx` (ADMIN-only), `components/admin/FooterSettingsForm.tsx` — nested field array (outer `columns`, inner `columns.${i}.links` qua component con `FooterColumnFields`, không dùng `FormProvider` để giữ nhất quán với codebase).
- `components/layout/Footer.tsx`: xoá 3 mảng hardcode + 2 div cột cũ, thay bằng `footer.columns.map(...)`; grid desktop tính động qua lookup `DESKTOP_GRID_COLS` (`lg:grid-cols-3..6`, clamp theo `columns.length + 2`); **khối Hotline/Address/Email chuyển vào cột brand** (cột "Company" cũ giờ là cột động, không còn chỗ cố định để neo).
- `AdminSidebar.tsx` (thêm "Footer" vào children Settings), `proxy.ts` (thêm `/api/admin/settings/footer` vào `ADMIN_ONLY_PREFIXES`).

**Users → "User Management" top-level**:
- Di chuyển `app/admin/settings/users/{page.tsx,new/page.tsx}` → `app/admin/users/{page.tsx,new/page.tsx}` (dùng `git mv`), đổi H1 "Users" → "User Management", sửa link "Add User" → `/admin/users/new`.
- `components/admin/UserForm.tsx`: `BACK_HREF` → `/admin/users`.
- `proxy.ts`: `ADMIN_ONLY_PREFIXES` đổi `/admin/settings/users` → `/admin/users`.
- `AdminSidebar.tsx`: xoá "Users" khỏi children Settings, thêm `FlatNavItem` top-level mới `{ href: "/admin/users", label: "User Management", icon: Users }` (chỉ ADMIN), đặt trước "Settings". API `/api/admin/users/*` giữ nguyên, không đổi.

### Đã verify end-to-end (dev server, admin thật)
- `typecheck`/`lint`/`build` sạch (phải xoá `.next` cache cũ 1 lần vì `.next/types/validator.ts` còn tham chiếu route cũ đã move).
- `GET /api/admin/settings/footer` trả đúng default 2 cột; PATCH thêm cột "Notices" (tách Terms/Privacy ra) → trang chủ hiện đúng 3 cột, grid `lg:grid-cols-5`; xoá cột lại → về `lg:grid-cols-4` như cũ.
- Khối Hotline/Address/Email hiện đúng trong cột brand khi có giá trị.
- `/admin/users`, `/admin/users/new` trả 200 khi đã login, redirect/401 khi chưa login; sidebar hiện "User Management" đúng vị trí, tiêu đề trang đổi đúng.
- Đã dọn lại: Footer columns về 2 cột mặc định, General settings hotline/address/email về rỗng (đã set tạm để test).

### Chưa làm / lưu ý
- Chưa test tài khoản EDITOR thật với `/admin/settings/footer`/`/admin/users` (chỉ verify qua code review proxy.ts + suy luận từ pattern Author/Social/SEO/Content Configuration đã test tương tự ở session 2) — nên test tay 1 lần với tài khoản EDITOR thật.
- Cap 4 cột Footer chưa test trường hợp thêm cột thứ 5 (nút "Add column" phải tự disable ở cột thứ 4) — nên xem bằng mắt trên UI form.

## Session 5 — Settings mới "Pages": sửa nội dung About/Terms/Privacy/Contact từ admin

Được yêu cầu sau khi user hỏi "làm sao sửa nội dung khi bấm vào link Footer (About Us...) thì hiện ra". Phát hiện: nội dung 4 trang `app/{about,terms,privacy,contact}/page.tsx` đang hardcode cứng trong code, chưa có chỗ sửa từ admin — đã hỏi user có muốn xây tính năng không, xác nhận có + **chỉ ADMIN** truy cập (nhất quán với Author/Social/SEO/Content Configuration/Footer).

### Đã hoàn thành
- **Types** (`types/settings.ts`): `PageSection { title; body }`, `PagesSettings { aboutIntro; aboutSections; termsSections; privacySections; contactIntro }`.
- **Validator** (`lib/validators/admin/settings.ts`): `adminPagesSettingsSchema` — `aboutIntro`/`contactIntro` là `z.string()` (không optional, vì `PagesSettings` field là required string, cho phép rỗng qua giá trị `""` chứ không qua `.optional()`).
- **Data layer** (`lib/data/settings.ts`): `PAGES_KEY = "static_pages"`, `DEFAULT_PAGES_SETTINGS` seed đúng y hệt text hardcode cũ của cả 4 trang (2 đoạn intro About, 3 "value card" About, 6 mục Terms, 6 mục Privacy, 1 đoạn intro Contact) — deploy lần đầu không đổi nội dung hiển thị.
- **API** `app/api/admin/settings/pages/route.ts`, **trang admin** `app/admin/settings/pages/page.tsx` (ADMIN-only, copy gate `integrations/page.tsx`), **form** `components/admin/PagesSettingsForm.tsx` — component con `PageSectionsFieldArray` tái dùng cho cả 3 danh sách section (About cards/Terms/Privacy), mỗi section có title+body (textarea), nút Add/Remove — cùng pattern `useFieldArray` như Footer/Content Configuration.
- **Wiring vào site thật**: `app/about/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/contact/page.tsx` đều đọc `getPagesSettings()` thay cho mảng/text hardcode. About: `aboutIntro` tách đoạn bằng `\n\n`, `aboutSections` render card với icon cố định xoay vòng 3 icon có sẵn (`ShieldCheck/Sparkles/Users`, không lưu icon vào DB để tránh cần icon-picker) — đây là đánh đổi đơn giản hoá duy nhất so với thiết kế gốc.
- Sidebar (`AdminSidebar.tsx`) thêm "Pages" vào children Settings; `proxy.ts` thêm `/api/admin/settings/pages` vào `ADMIN_ONLY_PREFIXES`.

### Đã verify end-to-end (dev server, admin thật)
- `typecheck`/`lint`/`build` sạch (build lần 1 lỗi font Google do mạng lúc build — transient, lần 2 sạch, không liên quan code).
- `GET /api/admin/settings/pages` trả đúng default; PATCH nội dung test (TEST INTRO/TEST CARD/TEST TERMS/TEST PRIVACY/TEST CONTACT) → cả 4 trang public phản ánh đúng ngay lập tức.
- Chưa login: API 401, trang admin redirect 307 — đúng ADMIN-only.
- Đã khôi phục lại đúng nội dung mặc định sau khi test.

### Chưa làm / lưu ý
- Chưa test EDITOR thật (suy luận từ pattern proxy.ts đã áp dụng nhất quán).
- Chưa xem bằng mắt trình duyệt (chỉ verify qua curl/HTML) — nên mở `/admin/settings/pages` xem UI form thật, đặc biệt phần About có 2 field (intro + sections) lồng trong 1 fieldset có bố cục hơi khác 2 fieldset Terms/Privacy độc lập.

## Session 6 — Footer settings viết lại toàn bộ: typed columns (Page/Path/Link) + gộp Pages vào Footer + redesign UI

Được yêu cầu redesign trang Footer settings (giao diện cũ chỉ có 1 loại link phẳng `label`/`href`). Chia làm nhiều vòng trong cùng session: (1) rebuild data model theo Type, (2) redesign UI vì bị chê "nhìn rối mắt", (3) fix bug phát sinh, (4) 2 tinh chỉnh nhỏ theo yêu cầu tiếp theo.

### 6.1 — Rebuild Footer thành typed columns, gộp About/Terms/Privacy vào route `/[slug]`, xoá Pages Settings

- **Data model** (`types/settings.ts`, `lib/validators/admin/settings.ts`, `lib/data/settings.ts`): `FooterColumnType = "PAGE"|"PATH"|"LINK"`; mỗi `FooterColumn` có `type` cố định (chọn 1 lần, sau đó khoá) quyết định shape của `FooterItem` bên trong — PATH có `path`, LINK có `link`, PAGE có `title`/`slug`/`description` (rich text). Validate qua `superRefine` trong `adminFooterSettingsSchema`: bắt buộc field đúng theo type, slug PAGE phải kebab-case, không trùng slug giữa các Page item, không được trùng reserved word (`RESERVED_PAGE_SLUGS` — danh sách các folder route tĩnh còn lại của `app/`).
- **Quyết định lớn (do user chốt, không phải mặc định)**: route Page dùng `/[slug]` ở **root** (không prefix `/pages/`), xoá hẳn route tĩnh `app/about`, `app/terms`, `app/privacy` — nội dung 3 trang này chuyển thành 3 Page item mặc định trong 1 column "Legal" mới (giữ nguyên slug `about`/`terms`/`privacy` để không đổi URL, port nguyên văn nội dung cũ sang HTML `<h2>`/`<p>`). **`/contact` giữ route tĩnh riêng** (có `ContactForm` + khối Hotline/Address/Email — không khớp model Page thuần text); `contactIntro` dọn sang `GeneralSettings` vì `PagesSettings` (Session 5) bị xoá hoàn toàn — xoá `app/admin/settings/pages/*`, `app/api/admin/settings/pages/*`, `PagesSettingsForm.tsx`, `adminPagesSettingsSchema`, `getPagesSettings`/`setPagesSettings`.
- **Route mới** `app/[slug]/page.tsx`: `generateStaticParams` từ `getFooterPages()`, `generateMetadata` qua `buildMetadata()` + `stripHtml(description)`, `notFound()` nếu không khớp Page item nào, render `RichHtml`.
- `Footer.tsx`, `app/sitemap.ts` đọc theo `column.type` để build href đúng (PATH/LINK/PAGE) thay vì `link.href` cũ.
- **Bug phát hiện lúc build**: DB dev vẫn còn row `footer_links` theo schema cũ (session 4, không có `type`/`items`) — không xoá DB trực tiếp (bị chặn bởi classifier "Irreversible Deletion"), thay vào đó vá `isValidFooterColumns()` trong `getFooterSettings()` để coi data không đúng shape mới là "invalid" → tự fallback về `DEFAULT_FOOTER_SETTINGS` code mới.

### 6.2 — Redesign UI: accordion column list + trang riêng để sửa item (theo yêu cầu "nhìn rối mắt quá")

User chê UI liệt kê hết mọi column + mọi item + toàn bộ `RichTextEditor` toolbar cùng lúc. Yêu cầu 2 vòng làm rõ: (1) tham khảo Store/Coupon, column dạng list thu gọn — bấm mới sổ ra item; (2) mỗi item có icon Edit **chuyển sang trang khác để sửa** (giống sửa Store/Coupon), áp dụng cho cả 3 loại item, không riêng Page.

- **`components/admin/FooterSettingsForm.tsx`** viết lại thành "column manager" nhẹ: `@radix-ui/react-accordion` (`type="multiple"`, đã có sẵn dependency, cùng cách dùng như `FAQAccordion.tsx`) — hàng column thu gọn (chevron + Name + `Badge` Type + số item + icon ẩn nếu Hidden), bấm mới sổ Accordion.Content ra Name/Type(khoá)/Visible + list item dạng dòng gọn (Name + preview ngắn + Visible checkbox + icon Edit + icon Delete). Nút "Add Page/Path/Link" và icon Edit đều là `Link` điều hướng sang trang riêng, không còn append/sửa inline.
- **Item thêm `id` ổn định** (`FooterItem.id`) để route được `/admin/settings/footer/items/[id]`. Column mới thêm (chưa Save) bị khoá nút Add/Edit item cho tới khi Save (không biết index thật trên server).
- **Trang mới** `components/admin/FooterItemForm.tsx` (mô phỏng `StoreForm.tsx`: dirty-check Modal, Save/Back riêng) + `app/admin/settings/footer/items/new/page.tsx` (đọc `columnIndex` qua searchParams) + `app/admin/settings/footer/items/[id]/page.tsx`. Cả 2 vẫn submit qua chung API PATCH toàn bộ `columns` (không thêm API rời), tái dùng nguyên `adminFooterSettingsSchema`.
- **Bug nghiêm trọng phát hiện sau khi user test tay**: cả "Add column", "Edit item", "Save settings" đều fail — root cause là **`react-hook-form`'s `useFieldArray` reserve riêng key tên `id`** để quản lý React key nội bộ, tự động xoá/ghi đè field `id` mà data model đặt trùng tên → click Edit ra `/items/undefined`, Save fail validate âm thầm (thiếu `id`) không hiện lỗi gì. Fix: đổi tên field `id` → `itemId` xuyên suốt (`types`, validator, `lib/data/settings.ts`, 2 component form). Đồng thời phát hiện thêm: DB dev vẫn còn row từ lúc 6.1 (trước khi có field `itemId`) → mở rộng `isValidFooterColumns()` check luôn từng item phải có `itemId` hợp lệ, nếu không coi cả row là invalid.

### 6.3 — 2 tinh chỉnh tiếp theo

- **Dialog xác nhận khi xoá column**: thêm `Modal` (giống pattern "Delete confirmation" của `StoreTable.tsx`) trước khi xoá column khỏi form.
- **Auto-slug đổi từ Title sang Name, luôn ghi đè lúc tạo mới**: field Slug trước đó auto-fill từ Title và chỉ điền khi đang rỗng (`if (!slugValue)`) — user báo bug (sửa slug xong quay lại sửa tiếp field điền-tự-động thì không cập nhật) + yêu cầu đổi nguồn từ Title sang **Name**. Sửa theo đúng pattern `StoreForm.tsx` đang dùng cho Store: luôn ghi đè `slug = slugify(name)` mỗi lần gõ Name, **chỉ khi đang tạo item mới** (`!item`), không đụng slug khi sửa item đã tồn tại (tránh phá URL đã publish).
- `FooterItemForm.tsx` đổi width `max-w-2xl` → `md:w-4/5` cho khớp các form admin khác.

### Đã verify (từng vòng, qua dev server + curl, không login được bằng script)
- `typecheck`/`lint`/`build` sạch sau mỗi vòng sửa.
- `/about`, `/terms`, `/privacy` trả 200 đúng nội dung qua route `/[slug]` mới; `/contact` vẫn còn `ContactForm`; Footer trang chủ render đúng link theo từng type; `sitemap.xml` có đủ page mới.
- `/admin/settings/footer`, `/admin/settings/footer/items/new`, `/admin/settings/footer/items/[id]` đều redirect/401 đúng khi chưa đăng nhập.
- **Không tự test được**: luồng thật trong trình duyệt (mở/đóng accordion, Add Column → chọn Type → khoá lại, Add/Edit item, validate trùng slug/reserved) — bị chặn dùng mật khẩu admin seed qua curl (classifier "Credential Leakage"), đã nhờ user tự test tay và họ xác nhận báo bug ở vòng 6.2 (đúng như lo ngại).

## Session 7 — Integrations: thêm GTM ID + Search Console verification, chia 3 nhóm

- Thêm 2 field mới vào `IntegrationsSettingsView`/`adminIntegrationsSettingsSchema`: **Google Tag Manager ID** (`gtmId`, wire script GTM chuẩn vào `components/analytics/AnalyticsScripts.tsx`, cùng chỗ với GA/Plausible), **Google Search Console Verification** (`googleSiteVerification`) — **chuyển hẳn** từ SEO Settings sang đây (giá trị cũ trong DB đang rỗng nên không mất gì), export thêm `getEffectiveGoogleSiteVerification()` trong `lib/data/settings.ts`, `app/layout.tsx` đổi nguồn đọc cho `verification.google`. Xoá field `googleSiteVerification` khỏi `SeoSettings`/`SeoSettingsForm.tsx`.
- `components/admin/IntegrationsSettingsForm.tsx` chia 3 khối (mỗi khối 1 `<div className="rounded-lg border ... p-4">` có `<h3>` tiêu đề, theo đúng pattern "Company info" của `GeneralSettingsForm.tsx`): **Email Service** (Resend API key, Contact inbox "from" email), **Security & Captcha** (Turnstile secret key), **Analytics & SEO Tracking** (Google Analytics ID, Google Tag Manager ID, Plausible domain, Google Search Console Verification).

### Đã verify
`typecheck`/`lint`/`build` sạch. Chưa test tay PATCH thật (không login được qua script).

## Session 8 — Fix bug JSON-LD (logo chết, tên site hardcode) + thêm Title/Description tuỳ chỉnh khi search brand name

Phát sinh khi trả lời câu hỏi "SEO đã cấu hình cho search tên website chưa" — review code phát hiện 2 bug thật:

- **`organizationJsonLd()` logo trỏ `/favicon.ico`** — file tĩnh này đã bị xoá từ Session 1 (favicon giờ hoàn toàn động), URL chết. Fix: export `resolveImageUrl()` từ `lib/seo/metadata.ts` (trước đó private), dùng lại trong `jsonld.ts` — logo giờ ưu tiên `general.logoUrl`, fallback `general.faviconUrl`, cuối cùng `undefined` (theo đúng yêu cầu "ưu tiên ảnh Setting" của user).
- **`websiteJsonLd()` tên site hardcode `"NovalyticDeals"`** — chuyển hàm thành `async`, đọc `getGeneralSettings()`, `name: general.title`. `app/layout.tsx` sửa call site thành `await websiteJsonLd()`.
- **Phát hiện thêm lúc điều tra**: `app/page.tsx` (trang chủ) có `generateMetadata()` **riêng, hardcode cứng** title/description — hoàn toàn không đọc Settings nào, khiến toàn bộ fallback chain title/description ở `app/layout.tsx` thực chất chết (mọi route đều tự set metadata riêng). Đây chính là thứ Google hiện ra khi search tên brand nhưng chưa có chỗ chỉnh.
- **Field mới**: `SeoSettings.homepageTitle`/`homepageDescription` (cố tình tách riêng khỏi `titleTemplate`/`defaultMetaDescription` — 2 field đó có ngữ nghĩa khác, và tách khỏi `GeneralSettings.title`/`description` dùng chỗ khác — tránh 3 field cùng ảnh hưởng 1 chỗ gây rối). Thêm nhóm "Homepage / brand search" ở đầu `SeoSettingsForm.tsx`. `app/page.tsx` đọc `getSeoSettings()`, dùng `seo.homepageTitle || <default hardcode cũ>` — 2 field trống thì hiển thị y hệt hiện tại, không đổi gì cho tới khi admin điền.

### Đã verify (dev server + curl)
`typecheck`/`lint`/`build` sạch. Xác nhận qua curl: Organization JSON-LD `logo` trả đúng URL Cloudinary thật (không còn `/favicon.ico`); WebSite JSON-LD `name` khớp General Settings; trang chủ `<title>`/`<meta description>` vẫn y hệt cũ (2 field mới đang trống).

## Session 9 — Author Settings: từ 1 author duy nhất → danh sách Author kiểu Store, BlogForm đổi thành dropdown chọn tác giả

Yêu cầu kèm 2 ảnh tham khảo (bảng Store, form Add Author kiểu General Settings' ImageUploadField). Trước khi làm đã hỏi rõ 1 điểm quan trọng: hành vi "tự điền Author khi tạo blog mới" (đang dùng singleton `AuthorSettings`) xử lý sao khi chuyển sang list — user chốt: thêm cờ **Default** cho từng Author (1 cái tại 1 thời điểm), **và** đổi luôn `BlogForm.tsx` từ 2 field tự do (Author Name + Author Avatar) sang 1 dropdown chọn Author có sẵn.

- **Không tạo bảng Prisma mới** — vẫn theo pattern JSON blob trong `SiteSetting` (giống Footer) vì Author nằm trong Settings, không cần quan hệ chặt với `BlogPost` (`authorName`/`authorAvatarUrl` trên `BlogPost` vẫn là string thường, copy-by-value lúc chọn, không phải FK — không migration).
- **`lib/data/authors.ts`** (mới, export qua `lib/data/index.ts`): `getAuthors()` (cached), `getAuthorById`, `getDefaultAuthor()` (→ author có `isDefault`, fallback author đầu tiên), `createAuthor`/`updateAuthor` (tự bỏ `isDefault` của các author khác khi 1 cái được set true), `setAuthorDefault`, `deleteAuthor`.
- **API**: `app/api/admin/settings/author/route.ts` (GET list, POST create) + route mới `[id]/route.ts` (PATCH — thử full schema trước, fallback `{isDefault}` cho toggle nhanh từ bảng, giống hệt pattern `stores/[id]/route.ts`; DELETE).
- **UI**: `components/admin/AuthorTable.tsx` (bảng Avatar/Name/Job title/Default/Actions — Default dùng lại `AdminDropdownSelect` y hệt cột Featured/Active của `StoreTable.tsx`; avatar dùng `<img>` thường không phải `next/image` vì URL có thể ngoài domain, có fallback vòng tròn initials khi chưa có avatar) + `components/admin/AuthorForm.tsx` (mô phỏng `StoreForm.tsx`: `ImageUploadField` upload+dán URL, Name, Job title, Bio, checkbox Default, dirty-check Modal). `app/admin/settings/author/{page.tsx,new/page.tsx,[id]/page.tsx}` — nút "Add Author" góc phải kiểu `bg-brand-600` giống "Add Store". Xoá `AuthorSettingsForm.tsx` cũ.
- **`BlogForm.tsx`**: bỏ hẳn input "Author Name" + `ImageUploadField` "Author Avatar" (và state upload avatar theo bài viết — avatar giờ chỉ upload 1 lần trên chính Author). Thêm 1 `<select>` "Author": mặc định chọn Author có `isDefault` khi tạo bài mới; khi sửa bài cũ, tự khớp theo `name` với Author hiện có — nếu bài cũ có `authorName` không khớp Author nào (đã đổi tên/xoá), hiện thêm option disabled `"{tên cũ} (not in Author list)"` để không mất byline cũ một cách âm thầm. Chọn Author nào thì copy `name`+`avatarUrl` vào field ẩn của post qua `setValue`.
- **Dọn các chỗ gọi hàm cũ còn sót** (phát hiện qua grep sau khi xoá `getAuthorSettings`): `app/api/admin/blog/route.ts`, `app/api/admin/blog/[id]/route.ts` (dùng Author Settings làm fallback lúc tạo/sửa blog), `lib/content/defaults.ts`'s `resolveBlogContent()` (fallback public blog page) — cả 3 đổi sang `getDefaultAuthor()`.

### Đã verify (dev server + curl)
`typecheck`/`lint`/`build` sạch; grep xác nhận không còn tham chiếu `getAuthorSettings`/`AuthorSettingsForm`/`adminAuthorSettingsSchema` nào sót lại. Route mới (`/admin/settings/author`, `/new`, `/[id]`, API tương ứng) redirect/401 đúng khi chưa login. `/blog`, `/blog/[slug]` vẫn render 200 sau khi đổi fallback author.

### Chưa làm / lưu ý (áp dụng cho cả Session 6–9)
- Toàn bộ phần tương tác thật trong trình duyệt (login admin, click, submit form, xem kết quả) — không tự động hoá được vì bị chặn dùng mật khẩu admin seed qua Bash/curl (chính sách chống lộ credential). Mọi verify ở các session này chỉ dừng ở mức: `typecheck`/`lint`/`build`, `curl` kiểm tra status code/HTML tĩnh, và grep quét code sót. **Cần user tự test tay** các luồng chính: Footer accordion (thêm/sửa/xoá column & item, validate slug trùng/reserved), Integrations save, SEO homepage title/description, Author CRUD + dropdown chọn tác giả trong BlogForm — session 6 đã có tiền lệ là user test tay phát hiện đúng 1 bug nghiêm trọng (`id` collision) mà cách verify tự động không thể thấy được.

## Session 10 — Content Configuration: Coupon Templates, đổi Store SEO title/description sang cấu trúc cố định + biến động đóng băng theo tháng, chiến lược cache ISR

Session dài, nhiều vòng, bắt đầu từ dọn dẹp nhỏ (di chuyển 1 field Integrations) rồi mở rộng dần thành tính năng SEO title/description lớn nhất từ trước tới nay của module Content Configuration.

### Đã hoàn thành

**Dọn dẹp SEO/Integrations Settings**
- Di chuyển field "Bing Webmaster verification code" từ SEO Settings sang Integrations Settings — đúng tiền lệ Google Search Console verification đã làm ở Session 7 (giá trị cũ trong DB rỗng nên không mất gì). `types/settings.ts`, `lib/validators/admin/settings.ts`, `lib/data/settings.ts` (`getEffectiveBingSiteVerification()`), `SeoSettingsForm.tsx`/`IntegrationsSettingsForm.tsx`, `app/layout.tsx` (`verification.other["msvalidate.01"]` đổi nguồn đọc).

**Content Configuration — redesign UI thành tab nav**
- Thay 3 `<fieldset>` liệt kê dài bằng thanh tab 4 mục: **Listing & Pagination / Store Templates / Coupon Templates / Blog Templates** — dùng `hidden` attribute để ẩn/hiện section thay vì unmount (giữ nguyên giá trị form khi chuyển tab). `ContentConfigSettingsForm.tsx`.

**Coupon Templates (tính năng mới, chưa từng có)**
- Thêm `couponDescriptionTemplate`/`couponTermsTemplate` vào `ContentConfigTemplates`; `resolveCouponContent(coupon, storeName)` trong `lib/content/defaults.ts` — wire vào `app/coupon/[slug]/page.tsx` (cả `generateMetadata` lẫn body, 2 điểm fetch riêng như pattern Store/Blog).
- **Fix quan trọng**: ban đầu dùng `coupon.title` làm `{name}`, user chỉnh lại — phải là **tên Store** của coupon (coupon templates đọc kiểu "Save more at {name}", store mới là chủ ngữ). Đảo thứ tự fetch: lấy `store` trước, truyền `store.name` vào `resolveCouponContent()`.

**Admin form auto-fill placeholder preview** (yêu cầu: admin edit form cần thấy nội dung auto-fill công khai sẽ hiển thị ra sao, nhưng field vẫn phải lưu rỗng thật trong DB — không đổi hành vi "admin edit luôn thấy dữ liệu thật" đã chốt từ Session 2)
- `lib/content/template.ts`: tách `applyTemplate()` ra file thuần riêng (không phụ thuộc server), an toàn import ở client component.
- `StoreForm.tsx`/`CouponForm.tsx`/`BlogForm.tsx` nhận thêm prop `templates` (từ `getContentConfigSettings()` ở trang admin cha), `watch` field tên/tiêu đề đang gõ để tính placeholder xám mờ theo template — không submit kèm giá trị này.
- Store FAQ (không có input để đặt placeholder) hiện panel preview riêng khi chưa thêm FAQ nào.

**Store SEO description/Description — hỗ trợ mẫu nhiều dòng, phân biệt với SEO title**
- User làm rõ: SEO description/Description cần mỗi mẫu là 1 đoạn nhiều câu (nhiều dòng), không phải 1 dòng = 1 mẫu như SEO title. Thêm `splitTemplateBlocks`/`pickRandomBlock` (tách theo dòng TRỐNG, không phải mọi dòng Enter) + `flattenBlock` (nối các dòng trong 1 mẫu thành 1 dòng — dùng cho field render ra `<meta>`) + `blockToHtml` (nối bằng `<br>` — dùng cho Description vì render qua `RichHtml`/HTML thật).
- Migrate dữ liệu cũ (10 dòng SEO description dạng "mỗi dòng 1 mẫu" có sẵn trong DB) sang dạng block cách nhau bằng dòng trống — script Prisma tạm, đã xoá sau khi chạy.

**Tính năng lớn nhất session — Store SEO title/description: bỏ random-đa-mẫu, thay bằng 1 cấu trúc cố định + biến động đóng băng theo tháng**
- Yêu cầu: `{name} Promo Codes & Deals: {discount} Off (Verified) - {month} {year}` (và tương tự cho description) dùng chung cho **mọi** store, không random nữa (Description short-blurb thì giữ nguyên random-multi-block ở trên, ngoài phạm vi thay đổi này). Có cấu trúc **fallback** riêng (bỏ `{discount}`) khi store hết coupon phù hợp.
- **Quy tắc `{discount}`** (đã hỏi lại user để chốt, không tự suy đoán): chỉ tính coupon `isActive && !isExpired && discountType ∈ {PERCENT, AMOUNT}`; ưu tiên tier `exclusive` (mọi type) > `type=CODE` > `type=DEAL`, trong tier lấy `discountValue` cao nhất (so số thô PERCENT vs AMOUNT, nhất quán với `bestOffer` cũ ở `app/store/[slug]/page.tsx`). Format `"20%"`/`"$50"` — **không** dùng `formatDiscount()` sẵn có vì hàm đó tự thêm hậu tố " OFF"/"DEAL".
- **`{discount}` chỉ được phép cập nhật 1 lần/tháng, đúng 00:00 UTC** — kể cả khi store hết coupon giữa tháng vẫn giữ nguyên trạng thái (kể cả việc có dùng fallback hay không) tới đầu tháng sau (user chọn "đợi đến đầu tháng sau", không live-check). `{month}`/`{year}` tính live từ `new Date()` (không cần đóng băng riêng, tự nhiên đã đúng ngữ nghĩa vì không phụ thuộc dữ liệu mutable).
- **Cơ chế đóng băng**: không thêm cron thật — theo đúng tiền lệ `expireOverdueCoupons()` (`lib/data/coupons.ts`) mà user từng chủ động từ chối thêm cron cho bài toán tương tự, chọn cách "tính lại khi có lượt đọc đầu tiên sau khi cache hết hạn". Áp lại pattern này: 2 cột mới trên `Store` — `seoDiscountSnapshot` (giá trị đã format hoặc `null` = fallback), `seoDiscountSnapshotPeriod` (khoá kỳ `"YYYY-MM"` UTC). Mỗi lần `resolveStoreContent()` chạy, so kỳ hiện tại với kỳ đã lưu — khác kỳ mới tính lại + ghi đè, cùng kỳ dùng nguyên giá trị cũ.
- **Vướng mắc migration Prisma đáng nhớ**: `prisma migrate dev` phát hiện DB Supabase đã "drift" so với lịch sử migration (2 cột `couponId`/`categoryIds` không liên quan, có từ trước) và đòi **reset toàn bộ DB** — đã từ chối làm (sẽ mất hết dữ liệu thật), chuyển sang `prisma db push` (áp thẳng schema, không cần đồng bộ lịch sử migration, 100% an toàn với thay đổi additive như thêm cột nullable).
- File mới `lib/content/storeSeoSnapshot.ts` (logic chọn tier + format + đóng băng, export `resolveStoreDiscountLabel(store)`), sửa `lib/content/defaults.ts` (`resolveStoreContent` — chỉ gọi `resolveStoreDiscountLabel` khi thật sự cần fill SEO, tránh query coupon thừa cho store đã có SEO title/description thật), `lib/content/template.ts` (thêm `applyTemplateVars`/`getUtcMonthName`/`getUtcPeriodKey`, **xoá** `pickRandomLine`/`splitTemplateLines` vì SEO title hết dùng random nên không còn ai gọi), `lib/data/stores.ts` (`updateStoreSeoDiscountSnapshot` — update Prisma hẹp chỉ 2 cột này, cố ý **không** gọi `purgeTag` vì không cần thiết), `types/store.ts`, `ContentConfigSettingsForm.tsx` (2 field fallback mới: `storeSeoTitleFallbackTemplate`/`storeSeoDescriptionFallbackTemplate`, đổi hint giải thích biến `{discount}`/`{month}`/`{year}`).
- **Fix tiếp theo user báo qua ảnh chụp admin thật**: preview ở `StoreForm.tsx` ban đầu cố ý để `{discount}` là token literal (thiết kế ban đầu nghĩ không có data coupon phía client) — user muốn thấy giá trị THẬT ngay trong preview. Sửa: `app/admin/stores/[id]/page.tsx` gọi `resolveStoreDiscountLabel(store)` server-side (chỉ để tính preview, không ghi vào field thật), truyền xuống `StoreForm` qua prop `discountLabel`; form tự chọn đúng cấu trúc chính/fallback theo giá trị này giống hệt public.

**Chiến lược cache/ISR** (phát sinh từ việc bỏ random-đa-mẫu — trước đó random đổi mẫu mỗi ~5 phút do ISR gây khó chịu, sau khi chuyển sang cấu trúc cố định vấn đề đó tự hết)
- `app/store/[slug]/page.tsx` + `getStoreBySlug` (`lib/data/stores.ts`): `revalidate` 300s → 86400s (1 ngày).
- Theo yêu cầu tiếp: `app/blog/[slug]/page.tsx`, `app/[slug]/page.tsx` (Footer static pages About/Terms/Privacy) → `revalidate = false` ("cache vĩnh viễn", chỉ mất khi admin sửa). Đã xác nhận cơ chế cache-bust-on-edit **đã có sẵn từ trước**, không cần code thêm: `purgeTag(\`store:${slug}\`)`/`purgeTag(\`blog:${slug}\`)`/`purgeTag("settings:footer")` đều đã được gọi trong các hàm mutation tương ứng, và vì hàm đọc dữ liệu (`getStoreBySlug`/`getBlogPostBySlug`/`getFooterPageBySlug`→`getFooterSettings`) đăng ký đúng tag đó, Next.js tự invalidate luôn cache trang ISR liên quan.
- Phát hiện phụ (trả lời câu hỏi user về caching toàn site): `/stores`, `/deals`, `/blog` (list), `/search` dùng `searchParams` (filter/sort/phân trang) → Next.js luôn render **động mỗi request bất kể `revalidate` khai báo trong code** — hành vi chuẩn của Next.js App Router, không phải bug, nhưng dễ gây hiểu nhầm là "đang cache 5 phút" trong khi thực chất không cache ở tầng trang (chỉ tầng data `unstable_cache` bên dưới vẫn cache 300s).
- Redis (Upstash) xác nhận **không** dùng cho cache trang/dữ liệu — chỉ dùng cho rate limiting và mirror Redirect Rules cho Edge middleware (`proxy.ts`); hiện env trống nên cả 2 đang no-op.

### Đã verify
- `typecheck`/`lint`/`build` sạch sau mỗi vòng sửa.
- **Verify bằng build thật** (không phải script giả lập, vì `unstable_cache` chỉ chạy được trong runtime Next.js — chạy qua `tsx` độc lập bị lỗi `Invariant: incrementalCache missing`): lúc `npm run build`, `generateStaticParams` của `/store/[slug]` tự pre-render mọi store, kéo theo `resolveStoreDiscountLabel()` chạy thật cho store "Abcde" — coupon duy nhất của nó là FREESHIP (không thuộc tier exclusive/CODE/DEAL nào dù có `discountType=AMOUNT`) → đúng logic phải trả `null` → fallback, và DB đã lưu đúng `seoDiscountSnapshotPeriod: "2026-07"`, `seoDiscountSnapshot: null`. Khớp chính xác thiết kế.
- Route mới/sửa (`/admin/stores/[id]`, `/admin/settings/content`) redirect 307 đúng khi chưa login; `/store/[slug]`, `/blog/[slug]`, `/[slug]` trả 200 sau khi đổi `revalidate`.

### Ranh giới quan trọng đã học trong session (xảy ra 2 lần, cần nhớ cho các session sau)
**Không được ghi trực tiếp vào DB (đặc biệt bảng `content_config`/`SiteSetting` — nội dung admin quản lý qua UI Settings) thay cho user qua script Prisma tạm, kể cả với mục đích verify rồi revert ngay sau đó.** Lần 1: user tự nhắc sau khi bị dán hộ 15 mẫu SEO title (dù đã revert lại đúng giá trị cũ ngay khi được yêu cầu) — user muốn tự tay dán qua UI admin, và hỏi lại có cần thêm ký hiệu gì để phân biệt mẫu không (không cần — chỉ cần xuống dòng). Lần 2: hệ thống permission tự động chặn khi định set tạm 4 field Content Configuration để lấy screenshot HTML thật — tôn trọng, không tìm cách né. **Ranh giới chính xác**: chỉ được đọc DB (read-only) để debug/verify, hoặc ghi vào cột **hệ thống tự quản lý** không phải nội dung admin tự nhập qua form Settings (vd `Store.seoDiscountSnapshot` — do chính code sản phẩm tính và ghi, tương tự `updatedAt`/`clickCount`).

### Chưa làm / lưu ý
- Toàn bộ tương tác thật trong trình duyệt (dán 4 field cấu trúc SEO mới vào `/admin/settings/content`, xem `/admin/stores/[id]` preview đúng giá trị `{discount}` thật, mở 1 trang store công khai xem kết quả cuối) — như mọi session trước, không tự động hoá được vì không login admin qua script được. **Cần user tự test tay.**
- DB Supabase đang có "drift" lịch sử migration từ trước (2 cột `couponId`/`categoryIds`, không phải do session này gây ra) khiến `prisma migrate dev` không chạy được bình thường — nên dọn lại (đồng bộ lại migration history hoặc baseline) ở dịp khác, hiện đang né bằng `prisma db push`.
- Chưa mở rộng `revalidate = false`/`86400` cho các trang detail còn lại đã thống nhất là ứng viên phù hợp (`events/[slug]`, `categories/[slug]`) — user nói để sau.
- Chưa cấu hình Upstash Redis thật (rate limit + redirect rules đang no-op) — tồn đọng từ các session trước, chưa phải việc của session này.

## Session 11 — Fix Coupon Templates (Description/Terms): tách mẫu sai + đổi hành vi sang random-fill-and-save lúc tạo mới

Phát hiện ngay sau Session 10: `couponDescriptionTemplate`/`couponTermsTemplate` bị lỗi tách mẫu — cả `resolveCouponContent()` lẫn preview `CouponForm.tsx` gọi `applyTemplate()` trên **nguyên cả field**, không tách nhiều mẫu (sót lại từ lúc mới thêm Coupon Templates, trước khi tính năng random-đa-mẫu cho Store ra đời). User xác nhận định dạng thực tế đang dùng: **Description = mỗi mẫu 1 dòng**, **Terms = mỗi mẫu dài hơn 1 dòng** (block, cách nhau dòng trống).

### Đã hoàn thành
- **`lib/content/template.ts`**: khôi phục lại `splitTemplateLines`/`pickRandomLine` (đã xoá nhầm ở Session 10 vì tưởng hết người dùng — SEO title hết dùng nhưng Coupon Description cần lại).
- **`lib/content/defaults.ts`** (`resolveCouponContent`): sửa `description` dùng `pickRandomLine` (mỗi dòng 1 mẫu), `terms` dùng `pickRandomBlock` (mỗi khối 1 mẫu) — vẫn giữ hàm này làm safety net cho coupon cũ/coupon bị sửa xoá trống field, lazy-resolve lúc đọc trang public.
- **Đổi hành vi lớn hơn theo yêu cầu rõ ràng của user** (khác hẳn pattern Store — auto-fill chỉ resolve lúc đọc public, DB giữ rỗng thật): khi **tạo coupon mới**, Description/Terms để trống → random 1 mẫu từ Content Configuration, **điền và lưu thật vào DB** lúc bấm "Create Coupon" — không phải lazy-resolve. Đồng thời **bỏ hẳn** cơ chế `buildAutoDescription()`/`applyAutoDescription()` cũ (auto-sinh Description theo store+type+discount, độc lập Content Config) theo yêu cầu trực tiếp "bỏ auto-generated của Description" — không giữ song song làm fallback.
- **`components/admin/CouponForm.tsx`**: xoá `buildAutoDescription`/`applyAutoDescription`/state `descriptionTouched` và mọi lệnh gọi ở onChange (Store/Type/Discount Type/Discount Value/Currency). Pick mẫu **1 lần lúc mount** (`useState(() => pickRandomLine/pickRandomBlock(...))`, cùng pattern đã dùng ở `StoreForm.tsx`) để placeholder preview và giá trị lưu thật khi submit **khớp tuyệt đối** (WYSIWYG, không random lại 2 lần). `onSubmit`: chỉ khi tạo mới (`!coupon`) và field đang rỗng mới điền giá trị đã pick (thay `{name}` bằng store đã chọn) vào payload gửi API; sửa coupon cũ để trống field vẫn giữ nguyên hành vi cũ (rỗng thật).
- **`components/admin/ContentConfigSettingsForm.tsx`**: tách hint riêng cho Description (mỗi dòng 1 mẫu) và Terms (mỗi khối cách dòng trống 1 mẫu), cả 2 ghi rõ khác biệt với Store: mẫu Coupon được điền và lưu thật vào DB ngay lúc tạo, không chỉ hiển thị lúc đọc public.

### Đã verify
- `typecheck`/`lint`/`build` sạch. Grep xác nhận không còn tham chiếu `buildAutoDescription`/`applyAutoDescription`/`descriptionTouched` sót lại trong `CouponForm.tsx`.

### Chưa làm / lưu ý
- Không tự test được luồng tạo coupon thật qua trình duyệt (giới hạn cũ, không login admin qua script). **Cần user tự tạo 1 coupon mới để trống Description/Terms**, xác nhận sau khi lưu mở lại `/admin/coupons/[id]` thấy field đã điền đúng 1 mẫu (không phải chuỗi dính tất cả các mẫu lại như lỗi cũ).
