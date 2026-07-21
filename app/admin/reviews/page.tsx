import { getReviewsAdminPaginated, getPendingReviewCount, getAllStores } from "@/lib/data";
import { ReviewTable } from "@/components/admin/ReviewTable";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const [{ items: reviews, total }, pendingCount, stores] = await Promise.all([
    getReviewsAdminPaginated(page, pageSize),
    getPendingReviewCount(),
    getAllStores(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Reviews</h1>
      <p className="mt-1 text-sm text-muted-500">{pendingCount} pending moderation.</p>

      <div className="mt-6">
        <ReviewTable reviews={reviews} stores={stores} total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
