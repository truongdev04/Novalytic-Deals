"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCouponVote } from "@/lib/hooks/useCouponVote";

export function VoteButtons({
  couponId,
  upvotes,
  downvotes,
}: {
  couponId: string;
  upvotes: number;
  downvotes: number;
}) {
  const { votes, choice, vote } = useCouponVote(couponId, { up: upvotes, down: downvotes });

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => vote("up")}
        aria-pressed={choice === "up"}
        aria-label="This coupon worked"
        disabled={Boolean(choice)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
          choice === "up"
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-muted-300 text-muted-600 hover:bg-surface-100"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        {votes.up}
      </button>
      <button
        type="button"
        onClick={() => vote("down")}
        aria-pressed={choice === "down"}
        aria-label="This coupon didn't work"
        disabled={Boolean(choice)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
          choice === "down"
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-muted-300 text-muted-600 hover:bg-surface-100"
        )}
      >
        <ThumbsDown className="h-4 w-4" />
        {votes.down}
      </button>
    </div>
  );
}
