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

// Admin-facing paginated list — DB-level pagination instead of fetching
// every submission into memory (this table has no natural ceiling, since
// anyone can submit a coupon publicly).
export async function getSubmittedCouponsAdminPaginated(page: number, pageSize: number) {
  const [items, total] = await prisma.$transaction([
    prisma.submittedCoupon.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.submittedCoupon.count(),
  ]);
  return { items, total };
}

export async function getPendingSubmissionCount() {
  return prisma.submittedCoupon.count({ where: { status: "PENDING" } });
}

export async function updateSubmittedCouponStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) {
  return prisma.submittedCoupon.update({ where: { id }, data: { status } });
}
