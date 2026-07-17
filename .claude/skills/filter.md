---
name: filter
description: Consolidate multiple loose filter dropdowns on an admin list page into a single "Filter" button that opens a Modal panel, plus a "Clear All" button that appears while any filter is active.
---

Scope: any `/admin/*` list table with **2 or more** filter fields
(Category/Event/Featured/Pin/Status...). If a page only ever needs one
filter field, a single standalone `<select>` is still simpler — don't
force this pattern for that case.

## Pieces already built (reuse, don't duplicate)

- `components/ui/Modal.tsx` — Radix Dialog wrapper. Props: `open`,
  `onOpenChange`, `title?`, `children`. Already used elsewhere in the
  same table for the bulk-delete confirmation dialog. Centers via
  flexbox on the overlay (no `transform` on `Dialog.Content`) — keep it
  that way; a `transform`-positioned dialog makes native `<select>`
  popups inside it laggy/need-two-clicks on Chrome.
- `components/ui/Button.tsx` — `variant="outline"` / `variant="primary"`
  for the modal's Cancel/Apply buttons.
- `components/admin/SingleSelectDropdown.tsx` — use this for every
  field inside the Filter panel instead of a native `<select>`. Props:
  `options: {value, label}[]`, `value`, `onChange`, `placeholder`,
  optional `searchable`/`searchPlaceholder` for long option lists
  (Store, Event). Same widget already used for the standalone Store
  filter dropdown next to the Filter button — reusing it keeps the
  whole toolbar visually consistent and sidesteps the native-`<select>`
  lag inside the modal (see note above).

## Steps to apply

1. Each filter field gets its own **applied** `useState` (e.g.
   `categoryFilter`, `pinFilter`), defaulting to a shared `"all"`
   sentinel constant (`BOOL_FILTER_ALL` for boolean fields; a
   dedicated `*_FILTER_ALL` constant for non-boolean fields like
   Category/Event, since their "no filter" value can't just be
   `"all"` colliding with a real id). These applied states are what
   the table's `useMemo` filter actually reads.
2. Fold every applied field's condition into the table's existing
   `useMemo` filter (one `if (xFilter !== X_ALL) { ...return false }`
   block per field) — don't split into separate memos. Add every
   filter state variable to the dependency array.
3. Add a **draft** `useState` mirror for every field (e.g.
   `draftCategoryFilter`) — the Modal's `<select>` elements are
   controlled by the draft state, not the applied state. This is what
   makes selecting an option not immediately affect the table: only
   pressing "Apply filter" copies draft → applied.
4. Add a `hasActiveFilters` boolean (`OR` across every **applied**
   filter state `!==` its default) and a `clearAllFilters()` function
   that resets every applied **and** draft state to its default — but
   leaves the text search (`query`) untouched; "Clear All" only clears
   the structured filters and applies immediately (no Apply step for
   this button, unlike the modal's fields).
5. Replace the row of loose `<select>` elements with:
   - A **"Filter"** button (`Filter` icon from `lucide-react`), same
     visual style as the existing "Select Items" button. Its
     `onClick` must first copy every applied state into its draft
     counterpart (so the panel opens showing what's actually applied,
     not stale edits from a previous cancelled session), then open
     `showFilterModal`.
   - A **"Clear All"** button right next to it, rendered only when
     `hasActiveFilters` is true, calling `clearAllFilters()`.
   Keep the text search `<input>` where it already is, outside the
   modal — it is not one of the fields inside the Filter panel.
6. Build one `{value, label}[]` options array per field (`useMemo` if
   it derives from a prop like `events`/`stores`, plain array literal
   if it's a fixed small enum like Featured/Status), with the `"All
   ..."` sentinel option first. Render the panel as:
   ```tsx
   <Modal open={showFilterModal} onOpenChange={setShowFilterModal} title="Filters">
     <div className="space-y-4">
       <div>
         <label className="mb-1 block text-sm font-medium text-brand-950">Field name</label>
         <SingleSelectDropdown
           options={xFilterOptions}
           value={draftXFilter}
           onChange={setDraftXFilter}
           placeholder="All ..."
         />
       </div>
       {/* one block per field, in the order the user actually cares about */}
     </div>
     <div className="mt-5 flex justify-end gap-2">
       <Button variant="outline" onClick={() => setShowFilterModal(false)}>Cancel</Button>
       <Button variant="primary" onClick={applyFilters}>Apply filter</Button>
     </div>
   </Modal>
   ```
   where `applyFilters()` copies every draft state into its applied
   counterpart then closes the modal. Each field only ever selects
   **one value at a time** — no multi-select/checkbox lists here, even
   though some reference designs show checkbox-style filter panels.
   "Cancel", the modal's X icon, Esc, and clicking outside all just
   close the modal via `onOpenChange(false)` without calling
   `applyFilters()` — the draft is silently discarded and re-synced
   from applied state next time the Filter button is clicked.

## Already applied to

`StoreTable` (`components/admin/StoreTable.tsx`) — fields: Category,
Event, Featured, Pin, Status, all rendered with `SingleSelectDropdown`
per step 6 (Category and Event have `searchable`; Featured/Pin/Status
don't — small fixed enums).

`DealTable` (`components/admin/DealTable.tsx`) — fields: Type, Event,
Featured, Status, each rendered with `SingleSelectDropdown` per step 6
(Event has `searchable`). Store filter stays a standalone searchable
`SingleSelectDropdown` outside the modal — not part of this
consolidated set.

## Verify

Run `npm run typecheck` and `npm run lint`. Then in the browser: open
Filter, change a field, and confirm the table does **not** narrow yet;
press "Apply filter" and confirm it narrows then. Reopen Filter, change
a field, press Cancel (or Esc/click outside) instead, and confirm the
table is unaffected and reopening Filter again shows the last applied
values (not the discarded edit). Confirm "Clear All" appears once any
applied field is non-default and clicking it resets everything (but not
the text search) immediately, hiding itself again.
