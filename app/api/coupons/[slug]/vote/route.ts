import type { NextRequest } from "next/server";
import { incrementCouponVote } from "@/lib/data";
import { voteSchema } from "@/lib/validators/vote";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { voteRateLimit } from "@/lib/server/cache/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimited = await enforceRateLimit(voteRateLimit, getClientIp(request));
  if (rateLimited) return rateLimited;

  // Route segment is named "slug" to match the sibling /api/coupons/[slug]
  // route — the value passed here is always the coupon id.
  const { slug: id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid vote payload");

  const coupon = await incrementCouponVote(id, parsed.data.direction);
  if (!coupon) return jsonError(404, "Coupon not found");

  return jsonOk({ upvotes: coupon.upvotes, downvotes: coupon.downvotes });
}
