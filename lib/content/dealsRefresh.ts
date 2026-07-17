import {
  applyDealFeaturedSelection,
  getContentConfigSettings,
  getDealRefreshSettings,
  getDeals,
  rolloverHourlyDealClicks,
  setDealRefreshSettings,
} from "@/lib/data";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import type { Deal } from "@/types";

const AUTO_DEAL_INTERVAL_MS = 8 * 60 * 60 * 1000;

// Pure ranking: every active deal competes for a slot by lastHourClicks,
// highest first (ties broken by createdAt desc, matching the base list
// order) — no Pin-equivalent exception for Deal (not requested, unlike
// Store's rankPopularStores).
export function rankDealsByClicks(deals: Deal[], limit: number): string[] {
  const candidates = [...deals].sort((a, b) => {
    const diff = b.lastHourClicks - a.lastHourClicks;
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return candidates.slice(0, limit).map((d) => d.id);
}

async function refreshDealsByLastHourClicks(): Promise<void> {
  const [deals, config] = await Promise.all([getDeals(), getContentConfigSettings()]);
  const winnerIds = rankDealsByClicks(deals, config.pagination.bestDealsCount);
  await applyDealFeaturedSelection(winnerIds);
}

// Manual "Refresh Deal" action — ranks by lastHourClicks as it currently
// stands, doesn't touch the current->last rollover (that's exclusively an
// Auto Deal concern, see ensureAutoDealRollover below).
export async function refreshDealsNow(): Promise<{ lastRefreshedAt: string }> {
  await refreshDealsByLastHourClicks();
  purgeTag("deals:list");
  const lastRefreshedAt = new Date().toISOString();
  await setDealRefreshSettings({ lastRefreshedAt });
  purgeTag("settings:deal-refresh");
  return { lastRefreshedAt };
}

// Lazy 8-hour rollover for "Auto Deal" — mirrors the pattern in
// lib/content/popularStoresRefresh.ts (compare stored vs. current, recompute
// only when stale) but elapsed-time based rather than a calendar period key,
// since an 8h cycle has no natural calendar anchor the way a month does.
// Meant to be awaited once at the top of the home page's data-fetching, so
// the first real page load 8+ hours after the last rollover performs it
// before getFeaturedDeals() is read in the same request.
export async function ensureAutoDealRollover(): Promise<void> {
  const settings = await getDealRefreshSettings();
  if (!settings.autoDealEnabled) return;

  const elapsedMs = settings.lastRolloverAt
    ? Date.now() - new Date(settings.lastRolloverAt).getTime()
    : Infinity;
  if (elapsedMs < AUTO_DEAL_INTERVAL_MS) return;

  await rolloverHourlyDealClicks();
  await refreshDealsByLastHourClicks();
  const now = new Date().toISOString();
  await setDealRefreshSettings({ lastRolloverAt: now, lastRefreshedAt: now });
}
