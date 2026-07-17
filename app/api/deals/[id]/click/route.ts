import type { NextRequest } from "next/server";
import { incrementDealCurrentHourClicks } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { dealClickRateLimit } from "@/lib/server/cache/rateLimit";

// Public, unauthenticated click ping fired from DealProductCard's
// handleTrigger — fire-and-forget (keepalive), doesn't block or change the
// existing "open deal.url directly" UX. See lib/content/dealsRefresh.ts for
// how this counter is later rolled into the Today's best deals ranking.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await enforceRateLimit(dealClickRateLimit, getClientIp(request));
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const deal = await incrementDealCurrentHourClicks(id);
  if (!deal) return jsonError(404, "Deal not found");

  return jsonOk({ ok: true });
}
