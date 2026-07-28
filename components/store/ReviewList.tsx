"use client";

import { useState } from "react";
import { Star, User } from "lucide-react";
import type { Review } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";

const INITIAL_VISIBLE_COUNT = 3;

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={13}
          height={13}
          className={
            i < Math.round(value)
              ? "fill-accent-400 text-accent-400"
              : "fill-muted-200 text-muted-200"
          }
        />
      ))}
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = useState(false);

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-500">No reviews yet — be the first to leave one.</p>;
  }

  const visibleReviews = expanded ? reviews : reviews.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = reviews.length > INITIAL_VISIBLE_COUNT;

  return (
    <div>
      <ul className="space-y-4">
        {visibleReviews.map((review) => (
          <li key={review.id} className="rounded-xl border border-muted-200 bg-surface-0 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-muted-500">
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-950">
                  {review.authorName || "Anonymous"}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <ReviewStars value={review.rating} />
                  <span className="text-xs text-muted-500">
                    {formatRelativeTime(review.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            {review.body && <p className="mt-3 text-sm text-muted-600">{review.body}</p>}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show less" : "Show more reviews"}
          </Button>
        </div>
      )}
    </div>
  );
}
