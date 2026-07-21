"use client";

import { useState } from "react";
import { StoreCard } from "@/components/store/StoreCard";
import type { Store } from "@/types";

const COLUMNS_AT_DESKTOP = 5;
const ROWS_PER_PAGE = 10;
const PAGE_SIZE = COLUMNS_AT_DESKTOP * ROWS_PER_PAGE;

export function EventStoresGrid({
  stores,
  verifiedCouponCountByStore,
}: {
  stores: Store[];
  verifiedCouponCountByStore: Record<string, number>;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleStores = stores.slice(0, visibleCount);
  const hasMore = visibleCount < stores.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {visibleStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            couponCount={verifiedCouponCountByStore[store.id] ?? 0}
            countLabel="verified"
            pluralizeLabel={false}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-xl border border-muted-300 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface-100"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
