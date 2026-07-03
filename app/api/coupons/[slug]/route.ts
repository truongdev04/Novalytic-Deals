import type { NextRequest } from "next/server";
import { getCouponBySlug } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const coupon = await getCouponBySlug(slug);
  if (!coupon) return jsonError(404, "Coupon not found");
  return jsonOk(coupon);
}
