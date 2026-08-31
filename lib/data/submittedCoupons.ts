import { prisma } from "@/lib/server/db";
import { deleteCoupon } from "./coupons";

export interface CreateSubmittedCouponInput {
  title: string;
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
      title: input.title,
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

export async function getSubmittedCouponById(id: string) {
  return prisma.submittedCoupon.findUnique({ where: { id } });
}

export interface AdminSubmissionFilters {
  query?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

// Admin-facing paginated list — DB-level pagination + filtering instead of
// fetching every submission into memory (this table has no natural ceiling,
// since anyone can submit a coupon publicly).
export async function getSubmittedCouponsAdminPaginated(
  page: number,
  pageSize: number,
  filters: AdminSubmissionFilters = {}
) {
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" as const } },
            { storeName: { contains: filters.query, mode: "insensitive" as const } },
            { submitterEmail: { contains: filters.query, mode: "insensitive" as const } },
            { code: { contains: filters.query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.submittedCoupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.submittedCoupon.count({ where }),
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

export interface UpdateSubmittedCouponInput {
  title: string;
  storeName: string;
  websiteUrl: string;
  code?: string;
  discountUnit: string;
  discountValue: number;
  description: string;
  expiresAt?: string;
  submitterEmail: string;
}

export async function updateSubmittedCoupon(id: string, input: UpdateSubmittedCouponInput) {
  return prisma.submittedCoupon.update({
    where: { id },
    data: {
      title: input.title,
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

// Links the submission to the coupon that was created from it and flips it to
// APPROVED. `storeName` is overwritten with the store actually picked in the
// approve dialog, so the list stops showing the submitter's free-text name.
// The coupon itself is created by the caller (createCoupon).
export async function linkApprovedCoupon(id: string, couponId: string, storeName?: string) {
  return prisma.submittedCoupon.update({
    where: { id },
    data: {
      status: "APPROVED",
      couponId,
      ...(storeName ? { storeName } : {}),
    },
  });
}

export async function deleteSubmittedCoupon(id: string) {
  const submission = await prisma.submittedCoupon.findUnique({
    where: { id },
    select: { couponId: true },
  });
  // Deleting the submission also removes the coupon it produced — everywhere
  // it appears, since deleteCoupon() purges the coupon-list and coupon-slug
  // cache tags. Guard for a coupon that was already deleted elsewhere.
  if (submission?.couponId) {
    await deleteCoupon(submission.couponId).catch(() => {});
  }
  await prisma.submittedCoupon.delete({ where: { id } });
}
