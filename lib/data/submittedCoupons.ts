import { prisma } from "@/lib/server/db";

export interface CreateSubmittedCouponInput {
  storeName: string;
  websiteUrl: string;
  code?: string;
  discountUnit: string;
  discountValue: number;
  description: string;
  expiresAt?: string;
  submitterEmail: string;
}

export async function createSubmittedCoupon(input: CreateSubmittedCouponInput) {
  return prisma.submittedCoupon.create({
    data: {
      storeName: input.storeName,
      websiteUrl: input.websiteUrl,
      code: input.code || null,
      discountUnit: input.discountUnit,
      discountValue: input.discountValue,
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
