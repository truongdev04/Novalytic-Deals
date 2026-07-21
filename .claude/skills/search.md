---
name: search
description: Store type-ahead autocomplete — debounced input, prefix-only DB matching, keyboard/click navigation. Use when adding or fixing a search-suggestion dropdown.
---

Scope: any input that suggests **stores** as the user types (type-ahead),
not the full `/search` results page (that page matches substring
anywhere in name/description on purpose — broader recall for an
explicit search action, different UX goal than a live suggestion list).

## Pieces already built (reuse, don't duplicate)

- `components/search/SearchAutocomplete.tsx` — the whole widget: input +
  dropdown + debounce + keyboard nav. Props: `id` (required, for
  `aria-label`/testing), `placeholder?`, `className?` (wrapper),
  `inputClassName?` (input element, e.g. hero uses a taller
  `h-[58px] rounded-2xl`).
- `app/api/search/route.ts` — the only consumer of this route is this
  component (fetched client-side; server components must call
  `searchStores()`/`filterCoupons()` directly per CLAUDE.md's
  no-internal-fetch rule). Don't add another caller to this route
  without checking that stays true.
- `searchStores()` in `lib/data/stores.ts` — shared between this
  endpoint (autocomplete) and `app/api/stores/route.ts` (used by the
  `/stores` full listing/search page). Has an `opts.nameStartsWith`
  flag; `/api/search` passes `nameStartsWith: true`, `/api/stores`
  leaves it `false` (default `contains` on name OR description).

## The bug this pattern prevents

Filtering to "starts with query" **after** the DB call, on a result set
that was already `take`-limited by a broader `contains` match, silently
drops valid matches. Example: querying `contains: "the"` with `take: 10`
ordered `name asc` fills all 10 slots with stores that merely have "the"
somewhere in their name/description (e.g. "Weather...", "Together...")
before the alphabet reaches "The Wizards Box" — so a client-side
`.filter(s => s.name.startsWith(q))` afterward finds zero matches even
though a real prefix match exists in the DB. **Prefix filtering must
happen in the Prisma `where` clause itself** (`name: { startsWith: q,
mode: "insensitive" }`), so `take` operates on the already-correct
candidate set.

Same reasoning applies to any other "top N of a filtered+capped list"
UI — check whether the filter and the cap are applied in the right
order before shipping a suggestion/autocomplete feature.

## Steps to apply (new autocomplete surface)

1. Drop in `<SearchAutocomplete id="unique-id" />` wherever the input
   goes — it's self-contained (own `useState`, click-outside close,
   debounce). Don't re-implement fetch/debounce logic elsewhere.
2. If matching a different field/model than stores, extend
   `searchStores`'s pattern rather than writing ad-hoc filtering: add
   the prefix condition to the Prisma `where` clause directly, keep the
   `contains` path as the default for non-autocomplete callers.
3. Keep the debounce at 300ms (`components/search/SearchAutocomplete.tsx`)
   and the dropdown cap at 6 results — matches the DB `take: 10` in
   `/api/search` with headroom for the coupon results also returned by
   that endpoint (unused by this component today, but part of the same
   response).

## Already applied to

`components/home/Hero.tsx` (home hero search), `components/layout/Header.tsx`
(desktop header search), `components/layout/HeaderMobileSearch.tsx`
(mobile header search), `app/stores/page.tsx` (stores directory hero
search — replaced the old `SearchBox` GET-form, whose `?q=` param was
never actually read by the page) — all render the same `SearchAutocomplete`.

`components/deal/DealsHero.tsx` (`/deals` hero) still uses the plain
`SearchBox`, not yet converted.

## Verify

```bash
curl -s "http://localhost:3000/api/search?q=the" | python3 -c \
  "import json,sys; print([s['name'] for s in json.load(sys.stdin)['data']['stores']])"
```
Confirm a store whose name starts with the query but whose alphabetically
earlier competitors merely *contain* the query still shows up (this was
the exact regression this skill documents). Then in the browser: type a
1-2 character prefix and confirm suggestions appear immediately (no
"needs 3 characters" threshold), press Enter to navigate to the first
result, click outside to close the dropdown without navigating.
