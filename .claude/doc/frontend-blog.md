# Redesign trang Blog — Tóm tắt session

## 1. Mục tiêu

Thiết kế lại trang blog công khai (`/blog`, `/blog/[slug]`) theo layout tham khảo dạng magazine, đồng thời dọn dẹp domain model blog (bỏ `tags` tự do, chuyển hẳn sang `BlogTopic` có cấu trúc).

## 2. Những phần đã hoàn thành

**Redesign `/blog` (`app/blog/page.tsx`)**
- Hero: bài có `isFirst === true`, fallback `isFirst → isFeatured đầu tiên → bài mới nhất` — `components/blog/BlogHero.tsx` (mới)
- Featured: 3 card từ `getFeaturedBlogPosts()`, loại bài trùng hero
- Latest: gộp chung với "Browse by topic" (đã bỏ tab riêng), filter theo `BlogTopic` thật qua `?topic=<slug>` (dùng `topic.slug` có sẵn trong schema, không tự chế slug), phân trang "Show more" 15 item/lần (5 hàng × 3 cột) — `components/blog/BlogPostGrid.tsx` (mới, copy pattern từ `components/category/CategoryGrid.tsx`)
- Bỏ sidebar phải hoàn toàn (tag-filter cũ + Newsletter card) → layout 1 cột full-width; Newsletter chuyển thành band `bg-brand-700` cuối trang (pattern giống `app/page.tsx`)
- `<h1 className="sr-only">Blog</h1>` (giữ H1 cho SEO, ẩn tagline hiển thị)
- Đã xoá: `components/blog/BlogTopicTabs.tsx` (tạo ra ở vòng giữa rồi bị gộp/xoá do trùng lặp với Latest)

**Trang chi tiết `/blog/[slug]` (`app/blog/[slug]/page.tsx`)**
- Badge topic thật (tên + link `/blog?topic=<slug>`) thay cho badge tags cũ, lấy qua `getBlogTopicById()`
- `RelatedPosts` đổi thuật toán: match theo `topicId` thay vì `tags` (`lib/data/blog.ts` → `getRelatedBlogPosts`)
- `components/blog/RelatedPosts.tsx`: heading dùng `SectionHeader` (to hơn), grid `grid-cols-1 sm:grid-cols-3 gap-8` (bỏ bước trung gian 2 cột, tăng gap)

**Bỏ hẳn `tags` khỏi domain blog (đổi hướng: dùng `BlogTopic` thay tag)**
- DB: drop cột `tags` + index Gin `blog_posts_tags_idx` trên bảng `blog_posts` — chạy trực tiếp qua `prisma db execute` (SQL hẹp phạm vi, **không** dùng `prisma migrate dev` vì phát hiện DB có schema drift lớn không liên quan — xem mục 4)
- Code đã xoá field `tags`: `types/blog.ts`, `prisma/schema.prisma`, `lib/data/blog.ts` (`toBlogPost`, `toBlogPostCard`, `BLOG_CARD_SELECT`, `AdminBlogPostFields`, `createBlogPost`/`updateBlogPost`), `lib/validators/admin/blog.ts`, `app/api/admin/blog/route.ts`, `app/api/admin/blog/[id]/route.ts`, `components/admin/BlogForm.tsx`, `components/blog/BlogCard.tsx`, `components/blog/BlogHero.tsx` (bỏ badge tag, không thay thế), `prisma/seed.ts`, `data/blog.json`
- Đã chạy `npx prisma generate` sau khi đổi schema, restart dev server để load Prisma Client mới

**Bug fix phát sinh trong lúc làm**
- Nguyên nhân gốc bài mới không có "Related articles": `BlogForm.tsx` không có UI nhập `tags` → mọi bài tạo mới có `tags: []` → `getRelatedBlogPosts` return `[]` ngay. Đã fix triệt để bằng cách đổi hẳn sang match theo `topicId` (ở trên)
- Fix `CategoryChip` (`components/category/CategoryChip.tsx`) nhảy lên đầu trang khi đổi filter → thêm `scroll={false}` vào `Link`

## 3. Trạng thái hiện tại

- Dev server chạy ổn định tại `http://localhost:3000` (đã restart sau khi đổi Prisma schema)
- Đã verify qua curl: `/blog`, `/blog/[slug]`, filter `?topic=`, "Related articles" (hiện đúng bài cùng topic), "Show more" logic (chưa có dataset >15 bài để thấy nút xuất hiện thực tế, nhưng logic đã đúng)
- `npx tsc --noEmit` và `npm run lint` sạch xuyên suốt các thay đổi (chỉ còn 1 warning cũ không liên quan ở `lib/server/affiliate/redirect.ts`)
- **DB thật (Supabase) đã bị đổi**: cột `tags` + index trên bảng `blog_posts` đã bị drop thật, không thể hoàn tác trừ khi restore backup
- **Chưa có commit git nào** cho toàn bộ thay đổi trong session này (theo quy tắc chỉ commit khi được yêu cầu rõ)

## 4. Bước tiếp theo

- **Quan trọng — cần xử lý riêng:** `prisma/schema.prisma` đang có lượng lớn thay đổi chưa migrate, không liên quan đến blog, từ phiên làm việc trước: bảng `stores` (xoá `clickCount`, thêm `currentMonthClicks`/`isPin`/`lastMonthClicks`/`seoDiscountSnapshot`/`seoDiscountSnapshotPeriod`), bảng `users` (thêm `avatarUrl`/`fullName`/`permissions`/`phone`/`status`), bảng `submitted_coupons` (thêm `discountUnit`/`discountValue`/`websiteUrl`), enum mới `AdminUserStatus`. Ngoài ra migration folder `prisma/migrations/20260717042443_add_coupon_hourly_clicks` chưa được commit vào git. Cần dọn/migrate chính thức phần này trước khi chạy `prisma migrate dev` cho bất kỳ thay đổi schema nào khác, tránh bị yêu cầu reset DB.
- Review lại toàn bộ diff và quyết định commit khi sẵn sàng (chưa commit gì)
- Test "Show more" ở Latest với dataset thật >15 bài (hiện dev DB chỉ có ~9-10 bài)
- Hiện chỉ có 3 `BlogTopic` (`data-studies`, `shopping-guides`, `tips-tricks`), mỗi topic 3 bài — chưa có topic nào ≥4 bài để thấy "Related articles" hiển thị đủ 3 card cùng lúc với dữ liệu thật (đã verify đúng qua CSS/breakpoint, chưa verify bằng mắt với data thật)
- `components/store/StoreListAZ.tsx` vẫn là dead code từ trước (ghi nhận lại từ phiên redesign store trước đó, chưa xoá)
