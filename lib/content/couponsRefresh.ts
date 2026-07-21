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

// Lazy 8-hour rollover for "Auto Coupon" — mirrors ensureAutoDealRollover:
// elapsed-time based (no natural calendar anchor like a month), checked once
// per home page render by comparing Date.now() against a stored
// lastRolloverAt timestamp, only doing work once 8h have actually elapsed.
export async function ensureAutoCouponRollover(): Promise<void> {
  const settings = await getCouponRefreshSettings();
  if (!settings.autoCouponEnabled) return;

  const elapsedMs = settings.lastRolloverAt
    ? Date.now() - new Date(settings.lastRolloverAt).getTime()
    : Infinity;
  if (elapsedMs < AUTO_COUPON_INTERVAL_MS) return;

  await rolloverHourlyCouponClicks();
  await refreshTrendingCoupons();
  const now = new Date().toISOString();
  await setCouponRefreshSettings({ lastRolloverAt: now, lastRefreshedAt: now });
}
