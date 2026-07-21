import { prisma } from "@/lib/server/db";
import type { Review } from "@/types";
import type { Review as PrismaReview } from "@prisma/client";

function toReview(row: PrismaReview): Review {
  return {
    id: row.id,
    storeId: row.storeId,
    authorName: row.authorName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    isApproved: row.isApproved,
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

export interface CreateReviewInput {
  storeId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const row = await prisma.review.create({
    data: { ...input, isApproved: false },
  });
  return toReview(row);
}

export async function getAllReviews(): Promise<Review[]> {
  const rows = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toReview);
}

// Admin-facing paginated list — no filters today (the table has none), just
// DB-level pagination instead of fetching every review into memory.
export async function getReviewsAdminPaginated(
  page: number,
  pageSize: number
): Promise<{ items: Review[]; total: number }> {
  const [rows, total] = await prisma.$transaction([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count(),
  ]);
  return { items: rows.map(toReview), total };
}

// "Pending moderation" stat for the admin header — a dedicated count query
// instead of `.filter(r => !r.isApproved).length` on a page that no longer
// contains every row. Review.isApproved is indexed.
export async function getPendingReviewCount(): Promise<number> {
  return prisma.review.count({ where: { isApproved: false } });
}

export async function setReviewApproved(id: string, isApproved: boolean): Promise<Review> {
  const row = await prisma.review.update({ where: { id }, data: { isApproved } });
  return toReview(row);
}

export async function deleteReview(id: string): Promise<void> {
  await prisma.review.delete({ where: { id } });
}
