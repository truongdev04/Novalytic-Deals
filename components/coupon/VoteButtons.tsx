"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoteButtons({
  couponId,
  upvotes,
  downvotes,
}: {
  couponId: string;
  upvotes: number;
  downvotes: number;
}) {
  const [votes, setVotes] = useState({ up: upvotes, down: downvotes });
  const [choice, setChoice] = useState<"up" | "down" | null>(null);

  async function vote(type: "up" | "down") {
    if (choice) return;

    const previous = votes;
    setVotes((prev) => ({
      up: type === "up" ? prev.up + 1 : prev.up,
      down: type === "down" ? prev.down + 1 : prev.down,
    }));
    setChoice(type);

    try {
      const res = await fetch(`/api/coupons/${couponId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: type }),
      });
      if (!res.ok) throw new Error("vote failed");
    } catch {
      setVotes(previous);
      setChoice(null);
    }
  }

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
