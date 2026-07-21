import type { NextRequest } from "next/server";
import { createCoupon, getAllCoupons } from "@/lib/data";
import { adminCouponSchema } from "@/lib/validators/admin/coupon";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const coupons = await getAllCoupons();
  return jsonOk(coupons);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminCouponSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid coupon data");

  try {
    const coupon = await createCoupon({
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
    });
    return jsonOk(coupon, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return jsonError(409, "This slug is already in use. Please choose another one.");
    }
    return jsonError(500, "Failed to save coupon");
  }
}
