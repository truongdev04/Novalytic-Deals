import type { NextRequest } from "next/server";
import {
  deleteCoupon,
  getCouponById,
  setCouponActive,
  setCouponFeatured,
  setCouponVerified,
  updateCoupon,
} from "@/lib/data";
import { adminCouponSchema } from "@/lib/validators/admin/coupon";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await getCouponById(id);
  if (!coupon) return jsonError(404, "Coupon not found");
  return jsonOk(coupon);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick toggle from the list page sends only { isFeatured } or { verified };
  // the full edit form sends the complete adminCouponSchema shape.
  const fullUpdate = adminCouponSchema.safeParse(body);
  if (fullUpdate.success) {
    try {
      const coupon = await updateCoupon(id, {
        storeId: fullUpdate.data.storeId,
        slug: fullUpdate.data.slug,
        title: fullUpdate.data.title,
        description: fullUpdate.data.description,
        type: fullUpdate.data.type,
        code: fullUpdate.data.code || null,
        discountType: fullUpdate.data.discountType,
        discountValue: fullUpdate.data.discountValue,
        currency: fullUpdate.data.currency,
        affiliateUrl: fullUpdate.data.affiliateUrl,
        exclusive: fullUpdate.data.exclusive,
        verified: fullUpdate.data.verified,
        terms: fullUpdate.data.terms,
        startsAt: fullUpdate.data.startsAt ? new Date(fullUpdate.data.startsAt) : new Date(),
        expiresAt: fullUpdate.data.expiresAt ? new Date(fullUpdate.data.expiresAt) : null,
        isFeatured: fullUpdate.data.isFeatured,
        isTrending: fullUpdate.data.isTrending,
      });
      return jsonOk(coupon);
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        return jsonError(409, "This slug is already in use. Please choose another one.");
      }
      return jsonError(500, "Failed to save coupon");
    }
  }

  if (typeof body?.isFeatured === "boolean") {
    const coupon = await setCouponFeatured(id, body.isFeatured);
    return jsonOk(coupon);
  }
  if (typeof body?.verified === "boolean") {
    const coupon = await setCouponVerified(id, body.verified);
    return jsonOk(coupon);
  }
  if (typeof body?.isActive === "boolean") {
    try {
      const coupon = await setCouponActive(id, body.isActive);
      return jsonOk(coupon);
    } catch (error) {
      if (error instanceof Error && error.message === "COUPON_EXPIRED") {
        return jsonError(409, "Cannot activate: this coupon has already expired.");
      }
      if (error instanceof Error && error.message === "STORE_INACTIVE") {
        return jsonError(409, "Cannot activate: the store is currently inactive.");
      }
      return jsonError(500, "Failed to update coupon");
    }
  }
  return jsonError(400, "Invalid coupon data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteCoupon(id);
  return jsonOk({ deleted: true });
}
