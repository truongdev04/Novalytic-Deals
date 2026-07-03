import type { NextRequest } from "next/server";
import { getCouponById } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { revealRateLimit } from "@/lib/server/cache/rateLimit";

// Returns the coupon code + the internal /go/ path only — never the raw
// affiliateUrl, so the DOM never has to hold it (per CLAUDE.md affiliate rule).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimited = await enforceRateLimit(revealRateLimit, getClientIp(request));
  if (rateLimited) return rateLimited;

  // Route segment is named "slug" only to satisfy Next.js's rule that
  // sibling dynamic routes under /api/coupons/ share one segment name —
  // the value passed here is always the coupon id.
  const { slug: id } = await params;
  const coupon = await getCouponById(id);
  if (!coupon) return jsonError(404, "Coupon not found");

  return jsonOk({ code: coupon.code ?? null, goUrl: `/go/${coupon.id}` });
}
