import { prisma } from "@/lib/server/db";
import type { Review } from "@/types";
import type { Review as PrismaReview } from "@prisma/client";
import { recomputeStoreRating } from "./stores";

function toReview(row: PrismaReview): Review {
  return {
    id: row.id,
    storeId: row.storeId,
    authorName: row.authorName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    isApproved: row.isApproved,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getApprovedReviewsByStore(storeId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { storeId, isApproved: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toReview);
}

// Admin detail page — every review for a store, approved or hidden, newest first.
export async function getReviewsByStore(storeId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toReview);
}

export interface CreateReviewInput {
  storeId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const row = await prisma.review.create({
    data: { ...input, isApproved: true },
  });
  await recomputeStoreRating(row.storeId);
  return toReview(row);
}

export async function getAllReviews(): Promise<Review[]> {
  const rows = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toReview);
}

export interface StoreReviewSummary {
  storeId: string;
  /** Mean of every review's rating for the store (approved or not); 0 when none. */
  averageRating: number;
  reviewCount: number;
  /** Reviews an admin hasn't opened yet (isRead === false). */
  newCount: number;
  /** Reviews currently hidden from the storefront (isApproved === false). */
  hiddenCount: number;
}

// Pure rollup of raw review rows into one summary per store — split out from
// the query so it can be unit-tested without a database.
export function rollupStoreReviewSummaries(
  rows: { storeId: string; rating: number; isRead: boolean; isApproved: boolean }[]
): StoreReviewSummary[] {
  const byStore = new Map<
    string,
    { sum: number; count: number; newCount: number; hiddenCount: number }
  >();
  for (const row of rows) {
    const entry = byStore.get(row.storeId) ?? { sum: 0, count: 0, newCount: 0, hiddenCount: 0 };
    entry.sum += row.rating;
    entry.count += 1;
    if (!row.isRead) entry.newCount += 1;
    if (!row.isApproved) entry.hiddenCount += 1;
    byStore.set(row.storeId, entry);
  }

  return [...byStore.entries()].map(([storeId, entry]) => ({
    storeId,
    averageRating: entry.count > 0 ? entry.sum / entry.count : 0,
    reviewCount: entry.count,
    newCount: entry.newCount,
    hiddenCount: entry.hiddenCount,
  }));
}

// One row per store that has at least one review. The reviews table stays
// small (one row per visitor submission), so a single scan + in-memory
// rollup is simpler and cheaper than three grouped aggregate queries.
export async function getStoreReviewSummaries(): Promise<StoreReviewSummary[]> {
  const rows = await prisma.review.findMany({
    select: { storeId: true, rating: true, isRead: true, isApproved: true },
  });
  return rollupStoreReviewSummaries(rows);
}

export async function setReviewApproved(id: string, isApproved: boolean): Promise<Review> {
  const row = await prisma.review.update({ where: { id }, data: { isApproved } });
  await recomputeStoreRating(row.storeId);
  return toReview(row);
}

// Called when an admin opens a store's review detail page — everything there
// counts as seen, so it stops adding to that store's "new" count.
export async function markStoreReviewsRead(storeId: string): Promise<void> {
  await prisma.review.updateMany({
    where: { storeId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteReview(id: string): Promise<void> {
  const row = await prisma.review.delete({ where: { id } });
  await recomputeStoreRating(row.storeId);
}

export async function deleteReviewsByStore(storeId: string): Promise<number> {
  const { count } = await prisma.review.deleteMany({ where: { storeId } });
  await recomputeStoreRating(storeId);
  return count;
}
