"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close search" : "Search"}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-brand-900 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {open ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-t border-muted-200 bg-surface-0 py-3 shadow-sm md:inset-x-auto md:left-1/2 md:w-4/5 md:-translate-x-1/2 md:border-0 md:bg-transparent md:pb-2 md:pt-5 md:shadow-none">
          <Container className="md:max-w-none md:px-0">
            <SearchAutocomplete
              id="header-search"
              autoFocus
              clearOnSelect
              inputClassName="h-[52px]"
            />
          </Container>
        </div>
      )}
    </div>
  );
}
