"use client";

import { useEffect } from "react";
import { Star } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleButton } from "@/components/admin/ToggleButton";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

export function StoreReviewDetailTable({
  reviews,
  storeId,
}: {
  reviews: Review[];
  storeId: string;
}) {
  // Opening this page counts as seeing every review for the store, so it no
  // longer contributes to the "new" count on the grouped list. Fire-and-forget
  // and skip router.refresh() so the grey rows stay visible on this view.
  useEffect(() => {
    if (reviews.every((review) => review.isRead)) return;
    fetch(`/api/admin/reviews/store/${storeId}`, { method: "POST" }).catch(() => {});
  }, [storeId, reviews]);

  return (
    <div className="overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-100 text-xs uppercase text-muted-500">
          <tr>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Rating</th>
            <th className="w-96 min-w-96 px-4 py-3">Description</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr
              key={review.id}
              className={cn(
                "border-t border-muted-200",
                !review.isRead && "bg-surface-100"
              )}
            >
              <td className="px-4 py-3 font-medium text-brand-950">
                <span className="flex items-center gap-2">
                  {!review.isRead && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-brand-500"
                      aria-label="New review"
                    />
                  )}
                  {review.authorName}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="flex items-center gap-1 text-muted-700">
                  <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                  {review.rating}/5
                </span>
              </td>
              <td className="w-96 min-w-96 max-w-96 px-4 py-3 text-muted-600">
                <span className="line-clamp-2" title={review.body}>
                  {review.body}
                </span>
              </td>
              <td className="px-4 py-3">
                <ToggleButton
                  endpoint={`/api/admin/reviews/${review.id}`}
                  field="isApproved"
                  value={review.isApproved}
                  label={review.isApproved ? "Approved" : "Hidden"}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                {new Date(review.createdAt).toLocaleDateString("en-US")}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <DeleteButton
                    endpoint={`/api/admin/reviews/${review.id}`}
                    confirmLabel={review.title || `review by ${review.authorName}`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted-500">
                This store has no reviews.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
