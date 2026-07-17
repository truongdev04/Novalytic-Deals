import {
  applyFeaturedSelection,
  getContentConfigSettings,
  getPopularStoresSettings,
  getStores,
  rolloverMonthlyClicks,
  setPopularStoresSettings,
} from "@/lib/data";
import { getUtcPeriodKey } from "@/lib/content/template";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import type { Store } from "@/types";

type ClickField = "currentMonthClicks" | "lastMonthClicks";

// Pure ranking: stores that are both Pinned and Featured always keep their
// slot (their relative order/display is handled separately by
// getFeaturedStores()) — everything else competes for the remaining slots
// by click count, highest first (ties broken by createdAt desc, matching
// the base list order). A store that's Pinned but not yet Featured has no
// guaranteed slot (Pin only takes effect combined with Featured, same rule
// as getFeaturedStores()) — it competes normally, like any other candidate.
export function rankPopularStores(stores: Store[], clickField: ClickField, limit: number): string[] {
  const pinnedFeatured = stores.filter((s) => s.isPin && s.isFeatured);
  const pinnedFeaturedIds = new Set(pinnedFeatured.map((s) => s.id));
  const remainingSlots = Math.max(0, limit - pinnedFeatured.length);

  const candidates = stores
    .filter((s) => !pinnedFeaturedIds.has(s.id))
    .sort((a, b) => {
      const diff = b[clickField] - a[clickField];
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return [...pinnedFeaturedIds, ...candidates.slice(0, remainingSlots).map((s) => s.id)];
}

async function refreshPopularStoresByClicks(clickField: ClickField): Promise<void> {
  const [stores, config] = await Promise.all([getStores(), getContentConfigSettings()]);
  const winnerIds = rankPopularStores(stores, clickField, config.pagination.featuredStoresCount);
  await applyFeaturedSelection(winnerIds);
}

// Manual "Refresh Popular" action — ranks by this month's clicks so far,
// doesn't touch the monthly current->last rollover (that's exclusively an
// Auto Popular concern, see ensurePopularStoresAutoRollover below).
export async function refreshPopularStoresNow(): Promise<{ lastRefreshedAt: string }> {
  await refreshPopularStoresByClicks("currentMonthClicks");
  purgeTag("stores:list");
  const lastRefreshedAt = new Date().toISOString();
  await setPopularStoresSettings({ lastRefreshedAt });
  purgeTag("settings:popular-stores");
  return { lastRefreshedAt };
}

// Lazy monthly rollover for "Auto Popular" — mirrors the pattern in
// lib/content/storeSeoSnapshot.ts (compare a stored UTC "YYYY-MM" period key,
// recompute only when it's stale) but site-wide instead of per-store: meant
// to be awaited once at the top of the home page's data-fetching, so the
// first real page load after 00:00 UTC on the 1st performs the rollover
// before getFeaturedStores() is read in the same request.
export async function ensurePopularStoresAutoRollover(): Promise<void> {
  const settings = await getPopularStoresSettings();
  if (!settings.autoPopularEnabled) return;

  const currentPeriod = getUtcPeriodKey(new Date());
  if (settings.lastRolloverPeriod === currentPeriod) return;

  await rolloverMonthlyClicks();
  await refreshPopularStoresByClicks("lastMonthClicks");
  await setPopularStoresSettings({
    lastRolloverPeriod: currentPeriod,
    lastRefreshedAt: new Date().toISOString(),
  });
}
