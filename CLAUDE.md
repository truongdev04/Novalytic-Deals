# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc với repo này.

## Tổng quan

**NovalyticDeals** — website Coupon / Deals / Affiliate cho thị trường **Mỹ & Châu Âu**. Mục tiêu: SEO Google mạnh, CTR/CVR cao, load nhanh, responsive, sẵn sàng gắn backend thật.

**Tham khảo:**

- UX/layout: [fireskycoupons.com](https://fireskycoupons.com/) — chỉ tham khảo pattern, không copy.
- Wireframe doc (Google Doc) là mockup ảnh, xác nhận cấu trúc: Home → Store → Category → Deal → Event → Blog; Backend = Dashboard + Settings. Spec chi tiết nằm trong `.claude/rules/` (xem mục "Tài liệu chi tiết" bên dưới).

**Design direction:** hiện đại, chuyên nghiệp, clean, premium. Primary **green**, accent **orange/yellow**, nền sáng, bo góc, shadow nhẹ, animation tiết chế. Chi tiết token: [.claude/rules/design.md](.claude/rules/design.md).

## Nguyên tắc làm việc

Ưu tiên thận trọng hơn tốc độ. Với task đơn giản/rõ ràng, dùng phán đoán để linh hoạt.

1. **Nghĩ trước khi code** — nêu rõ giả định, nếu không chắc thì hỏi thay vì đoán; nếu có nhiều cách hiểu, trình bày lựa chọn thay vì tự chọn ngầm; nếu có cách đơn giản hơn thì nói ra, phản biện khi cần.
2. **Đơn giản trước** — code tối thiểu đúng phạm vi yêu cầu, không thêm tính năng/abstraction/"linh hoạt" chưa ai cần, không xử lý lỗi cho tình huống không thể xảy ra.
3. **Sửa đúng phạm vi** — chỉ đụng phần liên quan đến yêu cầu, không tiện tay refactor/định dạng lại code xung quanh, giữ nguyên style hiện có. Dọn import/biến/hàm không dùng do chính thay đổi của mình gây ra; dead code có sẵn từ trước thì chỉ nêu ra, không tự xóa.
4. **Có tiêu chí hoàn thành rõ ràng** — "thêm validation" → viết test cho input sai rồi làm pass; "fix bug" → viết test tái hiện bug rồi fix; "refactor X" → đảm bảo test pass trước và sau. Task nhiều bước → nêu plan ngắn kèm cách verify từng bước.

**Khi phân vân:**

- Ưu tiên pattern Next.js chuẩn hơn là "thông minh".
- Đổi UI kéo theo đổi shape data → sửa `types/` + repo TRƯỚC, UI sau.
- Sắp hardcode content → dừng, chuyển vào mock/repo (xem "Kiến trúc dữ liệu" bên dưới).
- Trang mới → luôn kèm `generateMetadata` + JSON-LD phù hợp.

## Trạng thái & lệnh

Đã scaffold Next.js App Router với các route stub. Cập nhật lệnh khi `package.json` có thật — không bịa lệnh:

```
npm run dev         # dev server
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit  (thêm nếu chưa có)
```

## Tech stack

Next.js App Router · TypeScript strict · Tailwind · shadcn/ui · React Hook Form + Zod. Server Components mặc định, Client Components chỉ khi cần tương tác. Danh sách đầy đủ (frontend/backend libs, env vars): [.claude/rules/tech-defaults.md](.claude/rules/tech-defaults.md).

## Kiến trúc dữ liệu (bắt buộc)

```
UI (Server Component) → lib/data/* (repository, async) → mock JSON | Prisma | fetch(API)
```

- **KHÔNG hardcode content** trong page/component — mọi dữ liệu đi qua `lib/data/*`.
- UI **không** import mock trực tiếp, **không** gọi fetch nội bộ tới `/api/*` từ Server Component (gọi repository trực diện).
- Types trong `types/`, đồng bộ với `prisma/schema.prisma` khi có.
- Trong `lib/data/*`, nếu lọc/phân trang được ngay ở Prisma (`where`/`take`/`orderBy`/`groupBy`) thì làm ở đó thay vì fetch hết bảng rồi lọc bằng JS — miễn không ảnh hưởng đáng kể tốc độ tải trang. Chấp nhận fetch toàn bộ khi thật sự cần full list (vd A-Z index, sitemap, bảng tham chiếu nhỏ/bounded).
- Domain model, API surface, affiliate tracking, caching, search, auth, admin dashboard: [.claude/rules/backend-architecture.md](.claude/rules/backend-architecture.md).

## Tài liệu chi tiết (`.claude/rules/`)

- Route map: [site-structure.md](.claude/rules/site-structure.md)
- Component theo domain: [components.md](.claude/rules/components.md)
- Backend architecture (domain model, API, affiliate, caching, search, auth, admin): [backend-architecture.md](.claude/rules/backend-architecture.md)
- Design system (color/font/radius/motion): [design.md](.claude/rules/design.md)
- Tech stack đầy đủ + env vars: [tech-defaults.md](.claude/rules/tech-defaults.md)
- SEO checklist: [seo.md](.claude/rules/seo.md)
- Performance budget: [performance.md](.claude/rules/performance.md)
- UX/CVR pattern: [ux-cvr.md](.claude/rules/ux-cvr.md)
- Accessibility (WCAG AA): [accessibility.md](.claude/rules/accessibility.md)
- Code conventions & commit: [workflow.md](.claude/rules/workflow.md)
