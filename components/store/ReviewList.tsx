import type { Review } from "@/types";
import { Rating } from "@/components/ui/Rating";

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-500">No reviews yet — be the first to leave one.</p>;
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl border border-muted-200 bg-surface-0 p-5">
          <div className="flex items-center justify-between gap-4">
            <Rating value={review.rating} size={14} />
            <span className="text-xs text-muted-500">{formatReviewDate(review.createdAt)}</span>
          </div>
          <h3 className="mt-2 font-heading text-sm font-semibold text-brand-950">{review.title}</h3>
          <p className="mt-1 text-sm text-muted-600">{review.body}</p>
          <p className="mt-2 text-xs font-medium text-muted-500">{review.authorName}</p>
        </li>
      ))}
    </ul>
  );
}
