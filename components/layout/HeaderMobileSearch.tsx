"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

export function HeaderMobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close search" : "Search"}
        className="flex h-10 w-10 items-center justify-center rounded-full text-brand-900 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {open ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-t border-muted-200 bg-surface-0 p-3 shadow-sm">
          <SearchAutocomplete id="mobile-header-search" />
        </div>
      )}
    </div>
  );
}
