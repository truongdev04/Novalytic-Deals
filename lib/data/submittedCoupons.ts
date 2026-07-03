import { prisma } from "@/lib/server/db";

export interface CreateSubmittedCouponInput {
  storeName: string;
  code?: string;
  description: string;
  expiresAt?: string;
  submitterEmail: string;
}

export async function createSubmittedCoupon(input: CreateSubmittedCouponInput) {
  return prisma.submittedCoupon.create({
    data: {
      storeName: input.storeName,
      code: input.code || null,
      description: input.description,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      submitterEmail: input.submitterEmail,
    },
  });
}

export async function getSubmittedCoupons(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return prisma.submittedCoupon.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateSubmittedCouponStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) {
  return prisma.submittedCoupon.update({ where: { id }, data: { status } });
}
