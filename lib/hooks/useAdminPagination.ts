"use client";

import { useMemo, useState } from "react";

export function useAdminPagination<T>(items: T[], initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [trackedItems, setTrackedItems] = useState(items);

  // Jump back to page 1 whenever the underlying item set changes (e.g. a new
  // search query), so pagination never strands the user on an empty page.
  // Computed during render (not an effect) per React's "adjusting state when
  // a prop changes" pattern — avoids an extra render pass.
  if (items !== trackedItems) {
    setTrackedItems(items);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page: safePage,
    pageSize,
    paged,
    total: items.length,
    setPage,
    setPageSize: changePageSize,
  };
}
