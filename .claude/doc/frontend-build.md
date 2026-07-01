# Frontend Build Session — 2026-07-01

Tóm tắt phiên làm việc: build toàn bộ **frontend** cho NovalyticDeals dựa trên wireframe (Google Doc) và spec trong `CLAUDE.md`.

## Quyết định đã chốt cùng user

- **Wireframe**: Google Doc chỉ chứa ảnh chụp mockup (không có text mô tả), đọc được bằng cách export sang PDF (`File → Download → PDF`) rồi render từng trang bằng `pdftoppm` (đã cài `poppler` qua `brew install poppler`) + đọc bằng vision qua `Read` tool.
- **Kiến trúc**: giữ **1 Next.js app duy nhất** (đúng theo `CLAUDE.md`), tách rõ ràng bằng thư mục — `app/*` (marketing/shop routes) cho frontend, để dành `app/api/*`, `app/admin/*`, `app/go/[couponId]/` cho backend đợt sau. Không tách thành monorepo/2 project riêng.
- **Màu sắc**: mockup thật dùng tông blue/navy, nhưng user chọn **giữ đúng theo CLAUDE.md**: primary green, accent orange/yellow. Layout/bố cục bám sát ảnh, chỉ đổi palette.
- **Thứ tự**: code trước theo spec CLAUDE.md, không chờ ảnh mockup (đã xử lý xong ở bước trên).

## Đã hoàn thành

### Nền tảng
- Dependencies: `framer-motion`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner`, các package `@radix-ui/react-*` (dialog, accordion, tabs, dropdown-menu, tooltip, slot, select, label).
- `app/globals.css`: Tailwind v4 `@theme` tokens — `brand.*` (green), `accent.*` (orange/yellow), `surface.*`, `muted.*`. **Lưu ý**: dự án dùng Tailwind v4 (không có `tailwind.config.ts`), token định nghĩa bằng CSS `@theme` thay vì JS config — khác chữ với CLAUDE.md nhưng đúng tinh thần (không hardcode hex trong component).
- Font Inter (body) + Poppins (heading) qua `next/font/google`, cấu hình lại trong `app/layout.tsx`.
- `types/` — `Store`, `Coupon`, `Category` (+ `faq[]`), `BlogPost`, `Event`, `Review` — đồng bộ domain model trong CLAUDE.md.
- `data/*.json` — mock data: 16 stores (đủ A–Z index), ~34 coupons (đủ loại CODE/DEAL/CASHBACK/FREESHIP/BOGO, có cả coupon hết hạn để test), 8 categories (kèm FAQ), 10 events (khớp dropdown Event Sales trong wireframe), 8 blog posts (heading `## ` để dựng TOC).
- `public/images/**` — logo store, banner store/deal/blog/event, hero home: tất cả là **SVG placeholder tự sinh** (script `gen-images.js`, initials + gradient màu theo palette brand), không dùng ảnh/logo thật của các thương hiệu (tránh vấn đề bản quyền, không cần mạng ngoài).
- `lib/data/*` — repository layer (async, bọc `unstable_cache` với tag `stores:list`, `coupon:<slug>`... theo đúng pattern CLAUDE.md phần Caching) để sau này swap sang Prisma/API mà không đổi UI.
- `lib/seo/*` — `jsonld.ts` (Organization, WebSite+SearchAction, BreadcrumbList, Product+Offer, FAQPage, Article, AggregateRating), `JsonLdScript.tsx` (component render `<script type="application/ld+json">`), `metadata.ts` (`buildMetadata()` helper dùng chung cho mọi `generateMetadata`).
- `lib/icons.tsx`, `lib/blog.ts` (parser `## Heading` cho TOC), `lib/utils.ts` (`cn`, `formatDiscount`, `formatExpiration`, `isExpired`, `isExpiringSoon`, `buildQueryUrl`).
- `lib/validators/*` — Zod schema dùng chung cho form + API sau này (`newsletter`, `contact`, `submitCoupon`).

### Components
- `components/ui/*` — Button, Badge, Tag, Modal, Toast (wrap `sonner`), Rating, FAQAccordion, Pagination, LoadingSkeleton, EmptyState, BackToTop, Newsletter, SocialIcons (SVG tự vẽ vì `lucide-react` bản mới đã bỏ icon thương hiệu Facebook/Twitter/Instagram/Youtube).
- `components/layout/*` — Header (search + nav + dropdown "Event Sales" lấy từ data + CTA), MobileNav (drawer Radix Dialog), Footer, Breadcrumb (kèm JSON-LD), Container, SectionHeader, EventsDropdown.
- `components/store/*`, `components/coupon/*`, `components/category/*`, `components/blog/*`, `components/search/*`, `components/event/*`, `components/forms/*` — đầy đủ theo domain, bao gồm `CouponCodeModal` (modal "Show Code" auto-copy + toast + mở affiliate link tab mới), `StoreCouponTabs` (tabs All/Verified/Codes/Deals), `CountdownTimer` (event timer).

### Trang (routes)
Tất cả đã có `generateMetadata` + JSON-LD phù hợp + Breadcrumb:
`/`, `/stores`, `/store/[slug]`, `/categories`, `/categories/[slug]`, `/deals` (filter/sort/pagination qua query params, `FilterSidebar`/`SortDropdown` là client component dùng `useRouter`), `/coupon/[slug]` (modal reveal, vote, share, related), `/events`, `/events/[slug]` (countdown timer), `/blog`, `/blog/[slug]` (TOC từ `lib/blog.ts`), `/search` (kết hợp store + coupon results), `/about`, `/contact` (form RHF+Zod), `/privacy`, `/terms`, `/submit` (form RHF+Zod), `app/robots.ts`, `app/sitemap.ts`.

### Kiểm thử đã chạy
- `npx tsc --noEmit` — sạch.
- `npx eslint .` — sạch (đã sửa 2 lỗi từ rule mới của `eslint-plugin-react-hooks`/React Compiler: "component created during render" khi gán icon component vào biến rồi dùng như JSX tag → chuyển sang hàm `renderIcon()` trả về JSX trực tiếp; và "impure function during render" khi gọi `Date.now()` trực tiếp trong component → chuyển vào `lib/utils.ts` làm hàm thuần).
- `npm run build` — build production thành công, 93 trang generate (static + SSG + dynamic).
- Cài `poppler` (đọc PDF wireframe) và **Playwright** (chưa có `chromium-cli` trong môi trường) để chạy dev server thật và chụp ảnh headless toàn bộ trang chính + test tương tác (mở modal Show Code, mở mobile nav). Không có lỗi console, mọi trang trả 200, giao diện khớp wireframe (đã đổi màu theo yêu cầu).

## Việc đã bỏ qua / rút gọn có chủ đích (cần biết khi làm tiếp)

- **Không tạo route group** `(marketing)/(shop)/(legal)` như liệt kê trong CLAUDE.md "Directory layout" — giữ cấu trúc phẳng (`app/store/`, `app/blog/`...) đã có sẵn từ scaffold ban đầu vì route group chỉ là tổ chức thư mục, không đổi URL, tránh xáo trộn không cần thiết.
- **Blog body**: lưu dạng text với quy ước nhẹ `## Heading` (không phải MDX thật) để dựng TOC — cần thay bằng pipeline MDX + `rehype-sanitize` thật khi có CMS/backend.
- **Ảnh**: toàn bộ logo/banner là SVG placeholder tự sinh (initials + gradient), **chưa phải logo thật của Amazon/Nike/... regenerate lại khi có bộ nhận diện thương hiệu thật hoặc nguồn ảnh hợp lệ.
- **Submit coupon / Contact / Newsletter form**: validate + UI đầy đủ (React Hook Form + Zod) nhưng submit hiện chỉ `setTimeout` giả lập + toast, có `// TODO(backend)` đánh dấu chỗ nối `POST /api/*` thật (kèm rate limit, Turnstile, honeypot theo đúng CLAUDE.md).
- **CouponCodeModal / DealCard "Get Deal"**: mở thẳng `coupon.affiliateUrl` trong tab mới thay vì qua `/go/[couponId]` (chưa tồn tại) — có `// TODO(backend)` trong `components/coupon/CouponCodeModal.tsx`.
- **VoteButtons**: optimistic UI local-state only, chưa gọi `POST /api/coupons/[id]/vote`.

## Chưa làm — để dành cho đợt Backend

Theo đúng yêu cầu ban đầu ("làm frontend trước"), các phần sau **chưa động tới**:

- `app/api/*` (Route Handlers: coupons, stores, categories, blog, events, search, newsletter/subscribe, contact, submit-coupon, sitemap).
- `app/admin/*` — Dashboard (KPI, chart, activity feed, moderation inbox) + Settings (site meta, SEO, integrations, affiliate defaults, cache purge) theo đúng 2 ảnh mockup admin đã xem (`ND Admin` sidebar).
- `app/go/[couponId]/` — redirect handler log `ClickEvent` + tăng `usageCount` rồi 302 sang affiliate URL.
- Prisma schema (`prisma/schema.prisma`) + kết nối PostgreSQL, swap `lib/data/*` từ đọc JSON sang Prisma (giữ nguyên signature hàm, theo đúng pattern layered đã dựng).
- NextAuth (bảo vệ `/admin` + `/api/admin/*`), Redis/Upstash cache + rate limit, Resend (email), Cloudflare Turnstile.
- `.env.example`.
- Security headers trong `next.config.ts` (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-Options) — chưa thêm, nên làm cùng lúc với backend để tránh CSP chặn nhầm tài nguyên mới.

## Ghi chú môi trường

- Đã cài qua `brew`: `poppler` (đọc PDF).
- Đã cài Playwright + Chromium (qua `npx playwright install chromium`) để test — cài trong thư mục scratchpad tạm, **không** thêm vào `package.json` của project (không phải dependency chính thức của app). Nếu muốn có sẵn cho lần sau, cân nhắc chạy `/run-skill-generator` để lưu thành skill riêng cho project (môi trường chưa có `chromium-cli`).
