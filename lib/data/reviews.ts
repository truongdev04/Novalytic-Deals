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

export async function setReviewApproved(id: string, isApproved: boolean): Promise<Review> {
  const row = await prisma.review.update({ where: { id }, data: { isApproved } });
  return toReview(row);
}

export async function deleteReview(id: string): Promise<void> {
  await prisma.review.delete({ where: { id } });
}
