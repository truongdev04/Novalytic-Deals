"use client";

import { useMemo, useState } from "react";

export function useAdminPagination<T extends { id: string }>(items: T[], initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Track identity (which ids, in which order) rather than array reference —
  // `items` gets a brand new reference on every `router.refresh()` (e.g.
  // after toggling a Status dropdown) even when it's the same rows in the
  // same order, and reference equality alone would wrongly strand the admin
  // back on page 1 after every edit. Reset only when the actual row set
  // changes (search/filter, create, delete), so pagination never strands the
  // user on a now-empty page.
  const signature = items.map((item) => item.id).join(",");
  const [trackedSignature, setTrackedSignature] = useState(signature);

  if (signature !== trackedSignature) {
    setTrackedSignature(signature);
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
