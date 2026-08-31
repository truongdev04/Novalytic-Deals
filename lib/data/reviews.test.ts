import { describe, expect, it } from "vitest";
import { rollupStoreReviewSummaries } from "./reviews";

describe("rollupStoreReviewSummaries", () => {
  it("returns one summary per store with the mean of every rating", () => {
    const summaries = rollupStoreReviewSummaries([
      { storeId: "a", rating: 5, isRead: true, isApproved: true },
      { storeId: "a", rating: 4, isRead: false, isApproved: true },
      { storeId: "a", rating: 3, isRead: false, isApproved: false },
      { storeId: "b", rating: 2, isRead: true, isApproved: true },
    ]);

    const a = summaries.find((s) => s.storeId === "a")!;
    expect(a).toEqual({
      storeId: "a",
      averageRating: 4,
      reviewCount: 3,
      newCount: 2,
      hiddenCount: 1,
    });
    expect(summaries.find((s) => s.storeId === "b")!.averageRating).toBe(2);
  });

  it("counts unread reviews regardless of approval state", () => {
    const [summary] = rollupStoreReviewSummaries([
      { storeId: "a", rating: 1, isRead: false, isApproved: false },
      { storeId: "a", rating: 1, isRead: false, isApproved: true },
    ]);
    expect(summary.newCount).toBe(2);
    expect(summary.hiddenCount).toBe(1);
  });

  it("returns nothing for an empty input", () => {
    expect(rollupStoreReviewSummaries([])).toEqual([]);
  });
});
