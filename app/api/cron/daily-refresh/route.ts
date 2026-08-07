import { NextResponse } from "next/server";
import { expireOverdueCoupons } from "@/lib/data";
import { ensureAutoCouponRollover } from "@/lib/content/couponsRefresh";
import { ensureAutoDealRollover } from "@/lib/content/dealsRefresh";
import { ensurePopularStoresAutoRollover } from "@/lib/content/popularStoresRefresh";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { KNOWN_CACHE_TAGS } from "@/lib/server/cache/tags";

// Vercel Cron, once a day (see vercel.json) — the only thing that still
// drives time-based updates now that public pages cache permanently
// (revalidate: false) instead of on a 300s/86400s ISR window:
//   1. Expire overdue coupons (was previously a lazy side effect of
//      unstable_cache misses on public reads — those reads barely happen
//      anymore once pages stop re-rendering on a timer).
//   2. Run the Auto Coupon / Auto Deal / Auto Popular Stores rollover checks
//      (lib/content/*Refresh.ts) — normally lazy inside the home page's own
//      render, where purgeTag is disallowed; here we're in a Route Handler,
//      so we can purge right after.
//   3. Purge every list-level tag as a daily safety net, covering read paths
//      that don't carry a precise tag of their own (e.g. getRelatedStores).
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` for cron
// invocations when the CRON_SECRET env var is set on the project.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await expireOverdueCoupons();
  await ensureAutoCouponRollover();
  await ensureAutoDealRollover();
  await ensurePopularStoresAutoRollover();

  for (const tag of KNOWN_CACHE_TAGS) purgeTag(tag);

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
