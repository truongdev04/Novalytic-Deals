"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { buildQueryUrl, cn } from "@/lib/utils";
import { Dropdown } from "@/components/search/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "discount", label: "Highest Discount" },
];

// Desktop keeps the two inline dropdowns; on mobile they collapse behind a
// single filter icon that opens a "Filter Deals" dialog (Category + Sort),
// applied together on submit.
export function DealsFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categories.map((category) => ({ value: category.slug, label: category.name })),
  ];

  const currentCategory = searchParams.get("category") ?? "all";
  const currentSort = searchParams.get("sort") ?? "relevance";

  const [open, setOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(currentCategory);
  const [pendingSort, setPendingSort] = useState(currentSort);

  function pushFilters(category: string, sort: string) {
    router.push(
      buildQueryUrl(pathname, searchParams, {
        category: category === "all" ? undefined : category,
        sort: sort === "relevance" ? undefined : sort,
      })
    );
  }

  function openModal() {
    setPendingCategory(currentCategory);
    setPendingSort(currentSort);
    setOpen(true);
  }

  function apply() {
    pushFilters(pendingCategory, pendingSort);
    setOpen(false);
  }

  return (
    <>
      <div className="hidden gap-3 sm:flex">
        <Dropdown
          ariaLabel="Filter by category"
          options={categoryOptions}
          value={currentCategory}
          onChange={(value) => pushFilters(value, currentSort)}
          className="w-48"
        />
        <Dropdown
          ariaLabel="Sort results"
          options={SORT_OPTIONS}
          value={currentSort}
          onChange={(value) => pushFilters(currentCategory, value)}
          className="w-48"
        />
      </div>

      <button
        type="button"
        aria-label="Filter deals"
        onClick={openModal}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-muted-300 bg-surface-0 text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:hidden"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </button>

      <Modal open={open} onOpenChange={setOpen} title="Filter Deals">
        <div className="space-y-4">
          <ModalSelect
            label="Category"
            value={pendingCategory}
            options={categoryOptions}
            onChange={setPendingCategory}
          />
          <ModalSelect
            label="Sort by"
            value={pendingSort}
            options={SORT_OPTIONS}
            onChange={setPendingSort}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="rounded-lg" onClick={apply}>
            Apply
          </Button>
        </div>
      </Modal>
    </>
  );
}

// Custom select. The open panel is portaled to <body> and positioned with
// `fixed` coordinates so it can spill past the dialog's scroll box; it's
// tagged `data-modal-popover` so clicking it doesn't dismiss the dialog
// (see components/ui/Modal.tsx).
function ModalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    updatePosition();
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-brand-950">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-muted-300 bg-surface-0 px-4 text-left text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span className="truncate">{selected ? selected.label : label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open &&
        position &&
        createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            data-modal-popover
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="pointer-events-auto z-60 max-h-84 overflow-y-auto rounded-xl border border-muted-200 bg-surface-0 py-2 shadow-lg"
          >
            {options.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full px-4 py-2.5 text-left text-sm hover:bg-surface-100",
                    option.value === value ? "font-semibold text-brand-700" : "text-brand-950"
                  )}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}
