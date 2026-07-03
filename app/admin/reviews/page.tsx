import { getAllReviews, getAllStores } from "@/lib/data";
import { ReviewTable } from "@/components/admin/ReviewTable";

export default async function AdminReviewsPage() {
  const [reviews, stores] = await Promise.all([getAllReviews(), getAllStores()]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Reviews</h1>
      <p className="mt-1 text-sm text-muted-500">
        {reviews.filter((r) => !r.isApproved).length} pending moderation.
      </p>

      <div className="mt-6">
        <ReviewTable reviews={reviews} stores={stores} />
      </div>
    </div>
  );
}
