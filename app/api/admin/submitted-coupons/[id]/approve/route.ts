import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  createCoupon,
  getStoreById,
  getSubmittedCouponById,
  linkApprovedCoupon,
} from "@/lib/data";
import { adminCouponSchema } from "@/lib/validators/admin/coupon";
import { jsonError, jsonOk } from "@/lib/server/api/response";

// Approve a submission by creating a real coupon from the (admin-edited)
// dialog payload, then flip the submission to APPROVED and remember which
// coupon it produced (so deleting the submission later deletes that coupon).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "Unauthorized");

  const { id } = await params;
  const submission = await getSubmittedCouponById(id);
  if (!submission) return jsonError(404, "Submission not found");

  const body = await request.json().catch(() => null);
  const parsed = adminCouponSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid coupon data");

  let coupon;
  try {
    coupon = await createCoupon({
      storeId: parsed.data.storeId,
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      code: parsed.data.code || null,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      currency: parsed.data.currency,
      affiliateUrl: parsed.data.affiliateUrl,
      exclusive: parsed.data.exclusive,
      verified: parsed.data.verified,
      terms: parsed.data.terms,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date(),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      isFeatured: parsed.data.isFeatured,
      createdById: session.user.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return jsonError(409, "This slug is already in use. Please choose another one.");
    }
    return jsonError(500, "Failed to create coupon");
  }

  if (!coupon) return jsonError(500, "Failed to create coupon");

  const store = await getStoreById(coupon.storeId);
  await linkApprovedCoupon(id, coupon.id, store?.name);
  return jsonOk(coupon, 201);
}
