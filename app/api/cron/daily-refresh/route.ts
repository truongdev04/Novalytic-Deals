import { NextResponse } from "next/server";
import { expireOverdueCoupons } from "@/lib/data";
import { ensureAutoCouponRollover } from "@/lib/content/couponsRefresh";
import { ensureAutoDealRollover } from "@/lib/content/dealsRefresh";
import { ensurePopularStoresAutoRollover } from "@/lib/content/popularStoresRefresh";
import { purgeTag } from "@/lib/server/cache/purgeTag";

// Vercel Cron, once a day (see vercel.json) — the only thing that still
// drives time-based updates now that public pages cache permanently
// (revalidate: false) instead of on a 300s/86400s ISR window:
//   1. Expire overdue coupons.
//   2. Run the Auto Coupon / Auto Deal / Auto Popular Stores rollover checks
//      (lib/content/*Refresh.ts) — they used to run lazily inside the home
//      page's render; now this cron is their only trigger. Auto Popular is
//      monthly, Auto Deal/Coupon are 8h — a daily pass is close enough.
//
// Purging is now targeted (P3): each rollover helper purges its own tags
// when it actually does work, and coupon expiry is purged here only when a
// row was flipped. There is NO blanket KNOWN_CACHE_TAGS purge anymore — on a
// day nothing changed, this writes nothing. Every list/detail read path
// carries a tag that its mutation path already purges (audited). If a page
// is ever seen frozen on stale data, the fix is to add the missing tag to
// that read + its mutation, not to reinstate a daily purge-everything.
//
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` for cron
// invocations when the CRON_SECRET env var is set on the project.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const expiredCount = await expireOverdueCoupons();
  if (expiredCount > 0) purgeTag("coupons:list");

  // Each returns whether it did work; they purge their own tags internally.
  const rolled = {
    coupon: await ensureAutoCouponRollover(),
    deal: await ensureAutoDealRollover(),
    popular: await ensurePopularStoresAutoRollover(),
  };

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    expiredCount,
    rolled,
  });
}
