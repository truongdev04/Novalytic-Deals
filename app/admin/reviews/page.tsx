import { getStoreReviewSummaries, getAllStores } from "@/lib/data";
import { StoreReviewTable } from "@/components/admin/StoreReviewTable";

export default async function AdminReviewsPage() {
  const [summaries, stores] = await Promise.all([getStoreReviewSummaries(), getAllStores()]);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const rows = summaries
    .map((summary) => ({ ...summary, store: storeById.get(summary.storeId) }))
    .filter((row): row is typeof row & { store: NonNullable<(typeof row)["store"]> } =>
      Boolean(row.store)
    )
    .sort(
      (a, b) => b.newCount - a.newCount || b.reviewCount - a.reviewCount || a.store.name.localeCompare(b.store.name)
    );

  const totalNew = rows.reduce((sum, row) => sum + row.newCount, 0);
  const totalHidden = rows.reduce((sum, row) => sum + row.hiddenCount, 0);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Reviews</h1>
      <p className="mt-1 text-sm text-muted-500">
        {totalNew} new · {totalHidden} hidden · {rows.length} store{rows.length === 1 ? "" : "s"} with
        reviews.
      </p>

      <div className="mt-6">
        <StoreReviewTable
          rows={rows.map((row) => ({
            storeId: row.storeId,
            storeName: row.store.name,
            storeLogoUrl: row.store.logoUrl,
            averageRating: row.averageRating,
            reviewCount: row.reviewCount,
            newCount: row.newCount,
            hiddenCount: row.hiddenCount,
          }))}
        />
      </div>
    </div>
  );
}
