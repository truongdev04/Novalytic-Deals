"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/components/admin/SingleSelectDropdown";

export function MultiSelectDropdown({
  options,
  values,
  onChange,
  placeholder = "Select...",
  visibleCount = 15,
}: {
  options: SelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  visibleCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Lock page scroll while the dropdown is open so only the option list
  // scrolls — reverts the moment it closes. The admin layout scrolls its
  // <main> panel, not <body>, so that's the element that needs locking.
  useEffect(() => {
    if (!open) return;
    const scrollEl = (document.querySelector("main") as HTMLElement | null) ?? document.body;
    const previousOverflow = scrollEl.style.overflow;
    scrollEl.style.overflow = "hidden";
    return () => {
      scrollEl.style.overflow = previousOverflow;
    };
  }, [open]);

  const selectedSet = new Set(values);
  const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);
  const rowHeightPx = 32;

  function toggle(value: string) {
    onChange(selectedSet.has(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-left text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span className={cn("truncate", selectedLabels.length === 0 && "text-muted-400")}>
          {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-400" />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 z-10 mt-1 overflow-y-auto rounded-lg border border-muted-200 bg-surface-0 py-1 shadow-lg"
          style={{ maxHeight: rowHeightPx * visibleCount }}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-100"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selectedSet.has(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span className={selectedSet.has(option.value) ? "font-semibold text-brand-700" : "text-brand-950"}>
                {option.label}
              </span>
            </label>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-1.5 text-sm text-muted-400">No options available.</p>
          )}
        </div>
      )}
    </div>
  );
}
