"use client";

import { useState } from "react";

export function useCouponVote(couponId: string, initial: { up: number; down: number }) {
  const [votes, setVotes] = useState(initial);
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

  return { votes, choice, vote };
}
