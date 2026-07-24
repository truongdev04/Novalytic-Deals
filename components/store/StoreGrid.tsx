import { Link } from "next-view-transitions";
import { StoreCard } from "@/components/store/StoreCard";
import type { Store } from "@/types";

const COLUMNS_AT_DESKTOP = 5;
const ROWS_PER_PAGE = 3;
const PAGE_SIZE = COLUMNS_AT_DESKTOP * ROWS_PER_PAGE;

export function StoreGrid({
  stores,
  verifiedCouponCountByStore,
  viewAllHref,
}: {
  stores: Store[];
  verifiedCouponCountByStore: Record<string, number>;
  viewAllHref: string;
}) {
  const visibleStores = stores.slice(0, PAGE_SIZE);
  const hasMore = stores.length > PAGE_SIZE;

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
          <Link
            href={viewAllHref}
            className="rounded-xl border border-muted-300 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface-100"
          >
            View All
          </Link>
        </div>
      )}
    </div>
  );
}
