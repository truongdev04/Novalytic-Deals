# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**NovalyticDeals** is a Coupon / Deals / Affiliate website targeting users in the **United States** and **Europe**. Goals: strong Google SEO, high conversion rate (CVR) and CTR, fast load times, full responsiveness, and an architecture that's easy to extend with a backend later.

Reference material:
- UX/layout inspiration: [fireskycoupons.com](https://fireskycoupons.com/) — reference only for layout/UX patterns, do not copy verbatim.
- Wireframe doc (Google Doc): mostly image mockups, confirming the primary navigation is Home → Store → Category → Deal → Event → Blog. Treat the detailed spec below (from the project brief) as the source of truth over the doc, since the doc has little text content.

Design direction: modern, professional, clean, premium, trustworthy, highly readable. Primary color blue, accent orange/yellow, light background, generous white space, modern rounded corners, subtle shadows, tasteful animation.

## Project status

No source code exists yet — this is a blank slate. Before scaffolding, confirm with the user if anything below is ambiguous, then initialize with:

```
npx create-next-app@latest --typescript --tailwind --app --eslint
```

**Once scaffolded, replace this section and the "Build, lint, test" section below with the real commands** (`npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, how to run a single test, etc.). Do not invent commands that don't exist yet.

## Tech stack

Required:
- Next.js (App Router)
- TypeScript (strict mode)
- Tailwind CSS

Use where it fits:
- Server Components by default; Client Components only where interactivity is required
- shadcn/ui for base components
- lucide-react for icons
- Framer Motion for light, purposeful animation (not decoration for its own sake)
- React Hook Form + Zod for any forms (newsletter, contact, search filters)
- `next/image` for all images, `next/font` for Inter and Poppins

## Design system

- Colors: blue as primary/brand color, orange or yellow as accent, light/white backgrounds. Keep contrast WCAG-compliant.
- Fonts: Inter and Poppins, loaded via `next/font` (no external font CDN calls).
- Rounded corners, soft/subtle shadows, restrained motion (hover states, copy-code feedback, modal transitions) — avoid heavy or gratuitous animation.

## Site structure

Pages to build, each as its own route under `app/`:

- **Home** — Header, Nav, Hero Banner, Search Coupon, Popular Stores, Featured Coupons, Trending Deals, Categories, Recommended Stores, Latest Coupons, Newsletter, Footer
- **Store page** (`/store/[slug]`) — Store banner, logo, rating, description, active coupons, expired coupons, FAQ, related stores
- **Coupon detail** (`/coupon/[slug]`) — Coupon info, copy-code button, deal button, success popup, terms, expiration, user rating, share buttons
- **Categories** (`/categories`) — Category grid, search, pagination
- **Category detail** (`/categories/[slug]`)
- **Search results** (`/search`) — Search bar, filters, sort, coupon cards
- **About** (`/about`)
- **Contact** (`/contact`)
- **Privacy Policy** (`/privacy`)
- **Terms** (`/terms`)
- **Blog** (`/blog`) — Article list, featured article, sidebar
- **Blog detail** (`/blog/[slug]`) — TOC, author, related posts, share, FAQ

## Component library

Build these as reusable components under `components/` (avoid duplicating markup per page):

`Header`, `Footer`, `CouponCard`, `DealCard`, `StoreCard`, `CategoryCard`, `BlogCard`, `SearchBox`, `Breadcrumb`, `Pagination`, `FAQAccordion`, `Newsletter`, `Button`, `Modal`, `Popup`, `Rating`, `Badge`, `Tag`, `EmptyState`, `LoadingSkeleton`.

**No hard-coded content in pages/components.** All coupons, stores, categories, and blog posts must come from mock data (e.g. `data/` or `lib/mock-data/`) shaped as if it came from a real API/backend, so swapping in a real backend later is a data-layer change only.

## SEO checklist

- Semantic HTML, correct H1–H6 hierarchy per page
- Per-page meta title/description via Next.js Metadata API
- Open Graph and Twitter Card tags
- Canonical URLs
- `robots.txt` and `sitemap.xml`
- Structured data: Breadcrumb schema, FAQ schema, Organization schema, LocalBusiness schema where relevant

## Performance checklist

- Optimize for Core Web Vitals
- Lazy-load below-the-fold content and dynamic-import heavy/rarely-used components
- `next/image` for image optimization, `next/font` for font optimization
- Rely on Next.js code splitting; avoid large client bundles

## UX / conversion checklist

- Sticky header and sticky search
- Copy-coupon success animation + toast notification
- Hover effects on interactive cards
- Skeleton loading states, empty states
- Back-to-top control
- Dark mode is optional, not required

## Accessibility (WCAG)

- Full keyboard navigation
- ARIA labels on interactive/non-text elements
- Sufficient color contrast
- Visible focus states

## Code conventions

- TypeScript strict mode, no implicit `any`
- Split components by responsibility; keep pages thin, push logic/markup into `components/`
- No hard-coded data — see mock data note above
- Conventional Next.js App Router layout: `app/`, `components/`, `lib/`, `data/` (mock data), `types/`
