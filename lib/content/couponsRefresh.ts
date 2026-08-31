import {
  getCouponRefreshSettings,
  refreshTrendingCoupons,
  rolloverHourlyCouponClicks,
  setCouponRefreshSettings,
} from "@/lib/data";
import { purgeTag } from "@/lib/server/cache/purgeTag";

const AUTO_COUPON_INTERVAL_MS = 8 * 60 * 60 * 1000;

// Manual "Refresh Coupon" action — ranks by lastHourClicks as it currently
// stands, doesn't touch the current->last rollover (that's exclusively an
// Auto Coupon concern, see ensureAutoCouponRollover below).
export async function refreshCouponsNow(): Promise<{ lastRefreshedAt: string }> {
  await refreshTrendingCoupons();
  purgeTag("coupons:list");
  const lastRefreshedAt = new Date().toISOString();
  await setCouponRefreshSettings({ lastRefreshedAt });
  purgeTag("settings:coupon-refresh");
  return { lastRefreshedAt };
}

// 8-hour rollover for "Auto Coupon" — mirrors ensureAutoDealRollover:
// elapsed-time based (no calendar anchor). Runs from the daily Vercel Cron
// (app/api/cron/daily-refresh); purges its own tags since it's a route
// handler. refreshTrendingCoupons() ranks off getTrendingCandidateCoupons(),
// which is an uncached direct query — so no stale-click concern here.
// Returns whether it actually did work.
export async function ensureAutoCouponRollover(): Promise<boolean> {
  const settings = await getCouponRefreshSettings();
  if (!settings.autoCouponEnabled) return false;

  const elapsedMs = settings.lastRolloverAt
    ? Date.now() - new Date(settings.lastRolloverAt).getTime()
    : Infinity;
  if (elapsedMs < AUTO_COUPON_INTERVAL_MS) return false;

  await rolloverHourlyCouponClicks();
  await refreshTrendingCoupons();
  const now = new Date().toISOString();
  await setCouponRefreshSettings({ lastRolloverAt: now, lastRefreshedAt: now });
  purgeTag("coupons:list");
  purgeTag("settings:coupon-refresh");
  return true;
}
