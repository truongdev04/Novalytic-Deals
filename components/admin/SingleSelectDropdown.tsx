"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export function SingleSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  visibleCount = 15,
  searchable = false,
  searchPlaceholder = "Search...",
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  visibleCount?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function closeDropdown() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchInputRef.current?.focus();
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);
  const rowHeightPx = 32;

  const visibleOptions = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? closeDropdown() : setOpen(true))}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-left text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span className={cn("truncate", !selected && "text-muted-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-muted-200 bg-surface-0 shadow-lg">
          {searchable && (
            <div className="border-b border-muted-200 p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-1.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>
          )}
          <div
            className="overflow-y-auto py-1"
            style={{ maxHeight: rowHeightPx * visibleCount }}
          >
            {visibleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  closeDropdown();
                }}
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-100",
                  option.value === value ? "font-semibold text-brand-700" : "text-brand-950"
                )}
              >
                {option.label}
              </button>
            ))}
            {visibleOptions.length === 0 && (
              <p className="px-3 py-1.5 text-sm text-muted-400">No options available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
