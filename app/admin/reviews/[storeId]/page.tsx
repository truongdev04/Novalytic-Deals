import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getReviewsByStore, getStoreById } from "@/lib/data";
import { StoreReviewDetailTable } from "@/components/admin/StoreReviewDetailTable";

export default async function AdminStoreReviewsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [store, reviews] = await Promise.all([getStoreById(storeId), getReviewsByStore(storeId)]);
  if (!store) notFound();

  const hiddenCount = reviews.filter((review) => !review.isApproved).length;

  return (
    <div>
      <Link
        href="/admin/reviews"
        className="flex w-fit items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-600 hover:bg-surface-100 hover:text-brand-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-bold text-brand-950">{store.name} — Reviews</h1>
      <p className="mt-1 text-sm text-muted-500">
        {reviews.length} review{reviews.length === 1 ? "" : "s"} · {hiddenCount} hidden.
      </p>

      <div className="mt-6">
        <StoreReviewDetailTable reviews={reviews} storeId={storeId} />
      </div>
    </div>
  );
}
