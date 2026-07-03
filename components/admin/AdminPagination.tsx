"use client";

import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];
const MIN_ITEMS_TO_PAGINATE = 20;

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= MIN_ITEMS_TO_PAGINATE) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  function goTo(target: number) {
    onPageChange(Math.min(totalPages, Math.max(1, target)));
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page === 1}
          className="rounded-lg border border-muted-300 bg-surface-0 px-3 py-1.5 text-sm font-medium text-muted-700 hover:bg-surface-100 disabled:pointer-events-none disabled:opacity-40"
        >
          Pre
        </button>

        {pages.map((p, idx) => {
          const prevPage = pages[idx - 1];
          const showEllipsis = prevPage !== undefined && p - prevPage > 1;
          return (
            <span key={p} className="flex items-center gap-1.5">
              {showEllipsis && <span className="px-1 text-muted-400">…</span>}
              <button
                type="button"
                onClick={() => goTo(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium",
                  p === page
                    ? "border-brand-950 bg-brand-950 text-white"
                    : "border-muted-300 bg-surface-0 text-muted-700 hover:bg-surface-100"
                )}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg border border-muted-300 bg-surface-0 px-3 py-1.5 text-sm font-medium text-muted-700 hover:bg-surface-100 disabled:pointer-events-none disabled:opacity-40"
        >
          Next
        </button>
      </nav>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-muted-300 bg-surface-0 px-3 py-1.5 text-sm text-brand-950 focus:border-brand-400 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap text-sm text-muted-500">
          Showing {rangeStart} - {rangeEnd} of {total}
        </span>
      </div>
    </div>
  );
}
