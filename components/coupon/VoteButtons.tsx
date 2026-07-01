"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO(backend): wire to POST /api/coupons/[id]/vote instead of local state.
export function VoteButtons({ upvotes, downvotes }: { upvotes: number; downvotes: number }) {
  const [votes, setVotes] = useState({ up: upvotes, down: downvotes });
  const [choice, setChoice] = useState<"up" | "down" | null>(null);

  function vote(type: "up" | "down") {
    if (choice === type) return;
    setVotes((prev) => ({
      up: type === "up" ? prev.up + 1 : choice === "up" ? prev.up - 1 : prev.up,
      down: type === "down" ? prev.down + 1 : choice === "down" ? prev.down - 1 : prev.down,
    }));
    setChoice(type);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => vote("up")}
        aria-pressed={choice === "up"}
        aria-label="This coupon worked"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
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
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
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
