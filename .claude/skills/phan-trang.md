---
name: phan-trang
description: Add client-side pagination (Pre/Next, numbered pages, page-size select, "Showing X - Y of Z") to an admin list page under /admin/*, matching the style in public/images/anh/a2.png.
---

Scope: every `/admin/*` list page **except** Dashboard and Settings
(those aren't paginated tables).

## Pieces already built (reuse, don't duplicate)

- `lib/hooks/useAdminPagination.ts` — client hook. Takes the (already
  filtered) array and an optional initial page size (default 20).
  Returns `{ page, pageSize, paged, total, setPage, setPageSize }`.
  Resets to page 1 whenever the input array reference changes (e.g. a
  search query changes what's being paginated) — computed during
  render, not in a `useEffect`, per React's "adjusting state when a
  prop changes" pattern (avoids the `react-hooks/set-state-in-effect`
  lint error).
- `components/admin/AdminPagination.tsx` — the controls: `Pre` /
  numbered buttons with `…` windowing / `Next`, plus a page-size
  `<select>` (options `20, 50, 100, 200`) and a
  `Showing {start} - {end} of {total}` label. Pure props in, no
  routing/URL state — everything lives in the table's local state.
  Renders nothing (`return null`) when `total <= 20`
  (`MIN_ITEMS_TO_PAGINATE`) — pagination only appears once a list
  actually exceeds 20 items, even if the user has since switched to a
  larger page size.

## Steps to add pagination to a new/existing admin list

1. The table markup must live in a **Client Component**
   (`components/admin/XyzTable.tsx`, `"use client"`), not inline in
   the Server Component page — pagination needs interactive state.
   If the list is currently rendered straight in `app/admin/xyz/page.tsx`,
   extract the `<table>` into `components/admin/XyzTable.tsx` first,
   taking the full data array (and any lookup props like `stores`) as
   props. The page becomes: fetch via `lib/data/*` → pass the array to
   `<XyzTable items={...} />`.
2. Inside the table component:
   ```tsx
   const { page, pageSize, paged, total, setPage, setPageSize } =
     useAdminPagination(filteredItems); // or the raw prop array if there's no search box
   ```
   Render `paged` (not the full/filtered array) in the `<tbody>`.
3. After the table's closing `</div>` (the bordered wrapper), render:
   ```tsx
   <AdminPagination
     page={page}
     pageSize={pageSize}
     total={total}
     onPageChange={setPage}
     onPageSizeChange={setPageSize}
   />
   ```
4. If the table already has a search `<input>` with a `useMemo`
   filter (see `StoreTable.tsx`, `CouponTable.tsx`, `BlogTable.tsx`),
   pass the **filtered** array into `useAdminPagination`, not the raw
   prop — pagination must apply after search narrows the list.
5. For repo functions whose return type isn't in `types/` (e.g.
   Prisma-inferred results like `SubmittedCoupon`/`NewsletterSubscriber`),
   type the table's prop with
   `Awaited<ReturnType<typeof getXyz>>[number]` and `import type` the
   function from its `lib/data/*` module — this erases at compile time
   so no server-only code (Prisma client) leaks into the client bundle.

## Already applied to

`StoreTable`, `CouponTable`, `BlogTable`, `CategoryTable`, `EventTable`,
`ReviewTable`, `SubmissionTable`, `NewsletterTable`.

## Verify

Run `npm run typecheck` and `npm run lint` (the set-state-in-effect
rule is strict — always use the render-time reset pattern above, never
`useEffect(() => setPage(1), [items])`). Then click through Next/Pre
and change the page-size select in the browser to confirm the row
count and "Showing X - Y of Z" match.
