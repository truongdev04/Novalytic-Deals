"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Link } from "next-view-transitions";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Store } from "@/types";

type StoreResult = Pick<Store, "id" | "name" | "slug">;

// Destination for a suggestion — "store" (default) jumps to the store's own
// page (header/home/stores-directory searches). "deals-filter" (/deals)
// instead filters that page's own grid, since a store suggestion there
// should narrow the current listing, not navigate away. A string enum
// (rather than a callback prop) because this component is rendered from
// Server Component callers, which can't pass functions across the boundary.
type ResultMode = "store" | "deals-filter";

function buildResultHref(mode: ResultMode, store: StoreResult): string {
  return mode === "deals-filter"
    ? `/deals?q=${encodeURIComponent(store.name)}`
    : `/store/${store.slug}`;
}

export function SearchAutocomplete({
  id,
  placeholder = "Search stores...",
  className,
  inputClassName,
  defaultValue = "",
  resultMode = "store",
}: {
  id: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  defaultValue?: string;
  resultMode?: ResultMode;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // null = a search for the current query is in flight, [] = it finished with
  // zero matches (renders "No results found" and disables Enter).
  const [results, setResults] = useState<StoreResult[] | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const body = await res.json();
        if (cancelled) return;
        // /api/search already restricts stores to name-prefix matches
        // (nameStartsWith) sorted alphabetically — a real type-ahead, like
        // typing "ho" suggesting "Hobby Lobby", not "Yahoo".
        const stores: StoreResult[] = body?.data?.stores ?? [];
        setResults(stores.slice(0, 6));
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "Enter") return;
    // Only navigate when there's a real suggestion to jump to — no results
    // (or a search still in flight) means Enter does nothing.
    e.preventDefault();
    if (results && results.length > 0) {
      setOpen(false);
      router.push(buildResultHref(resultMode, results[0]));
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
      <input
        id={id}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // Reset immediately (from this event handler, not the debounce
          // effect) so stale results from the previous query never flash
          // while the new search is still pending.
          setResults(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Search stores"
        className={cn(
          "h-11 w-full rounded-xl border border-muted-300 bg-surface-0 pl-10 pr-9 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          inputClassName
        )}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setResults(null);
          }}
          aria-label="Clear search"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-400 hover:text-brand-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-muted-200 bg-surface-0 text-left shadow-lg">
          {results === null ? (
            <p className="px-4 py-3 text-sm text-muted-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-500">No results found</p>
          ) : (
            <ul>
              {results.map((store) => (
                <li key={store.id}>
                  <Link
                    href={buildResultHref(resultMode, store)}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm text-brand-950 hover:bg-surface-100"
                  >
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
