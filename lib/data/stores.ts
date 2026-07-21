import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { Store, StoreFaqItem, StoreRegion, StoreSeo } from "@/types";
import type { Store as PrismaStore } from "@prisma/client";
import { syncCouponWithStoreEvent } from "./events";

function throwIfSlugConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes("slug")
  ) {
    throw new Error("SLUG_TAKEN");
  }
  throw error;
}

function toStore(row: PrismaStore): Store {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    bannerUrl: row.bannerUrl ?? undefined,
    website: row.website,
    description: row.description,
    aboutStore: row.aboutStore,
    howToApply: row.howToApply ?? undefined,
    rating: row.rating,
    ratingCount: row.ratingCount,
    categoryIds: row.categoryIds,
    eventId: row.eventId ?? null,
    region: row.region,
    affiliateNetwork: row.affiliateNetwork,
    isFeatured: row.isFeatured,
    isPin: row.isPin,
    isActive: row.isActive,
    currentMonthClicks: row.currentMonthClicks,
    lastMonthClicks: row.lastMonthClicks,
    seo: row.seo as unknown as StoreSeo,
    faq: row.faq as unknown as StoreFaqItem[],
    seoDiscountSnapshot: row.seoDiscountSnapshot,
    seoDiscountSnapshotPeriod: row.seoDiscountSnapshotPeriod,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const getAllStoresCached = unstable_cache(
  async (): Promise<Store[]> => {
    const rows = await prisma.store.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toStore);
  },
  ["stores:list"],
  { tags: ["stores:list"], revalidate: 300 }
);

// Unfiltered — includes stores toggled off ("Status") for admin management.
// Public pages must use `getStores` (or a helper built on it) instead.
export async function getAllStores(): Promise<Store[]> {
  return getAllStoresCached();
}

export interface AdminStoreFilters {
  query?: string;
  categoryId?: string;
  // undefined = no filter, null = "Uncategorized" (eventId is null), string = specific event
  eventId?: string | null;
  isFeatured?: boolean;
  isPin?: boolean;
  isActive?: boolean;
}

// Admin-facing paginated list — sees hidden stores too, status is just
// another optional filter (unlike the public getStores()/getFeaturedStores()).
export async function getStoresAdminPaginated(
  filters: AdminStoreFilters,
  page: number,
  pageSize: number
): Promise<{ items: Store[]; total: number }> {
  const where: Prisma.StoreWhereInput = {};
  if (filters.categoryId) where.categoryIds = { has: filters.categoryId };
  if (filters.eventId !== undefined) where.eventId = filters.eventId;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.isPin !== undefined) where.isPin = filters.isPin;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const q = filters.query?.trim();
  if (q) where.name = { contains: q, mode: "insensitive" };

  const [rows, total] = await prisma.$transaction([
    prisma.store.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.store.count({ where }),
  ]);
  return { items: rows.map(toStore), total };
}

// Own query (not derived from getAllStoresCached) so the public path never
// pulls inactive stores into memory — `where` pushes the isActive filter
// down to Postgres instead of fetching the full table and filtering in JS.
// Same tag as getAllStoresCached so existing purgeTag("stores:list") calls
// invalidate both; distinct keyParts keep the two cache entries separate.
const getActiveStoresCached = unstable_cache(
  async (): Promise<Store[]> => {
    const rows = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toStore);
  },
  ["stores:active"],
  { tags: ["stores:list"], revalidate: 300 }
);

export async function getStores(): Promise<Store[]> {
  return getActiveStoresCached();
}

export const getFeaturedStores = unstable_cache(
  async (limit = 8): Promise<Store[]> => {
    const featured = await prisma.store.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
    });
    // Pin only takes effect combined with Featured — pinned stores lead the
    // list (most recently updated first), the rest keep the base createdAt
    // desc order from the query above.
    const pinned = [...featured]
      .filter((s) => s.isPin)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const rest = featured.filter((s) => !s.isPin);
    return [...pinned, ...rest].slice(0, limit).map(toStore);
  },
  ["stores:featured"],
  { tags: ["stores:list"], revalidate: 300 }
);

export async function getStoreBySlug(slug: string): Promise<Store | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.store.findUnique({ where: { slug } });
      if (!row || !row.isActive) return undefined;
      return toStore(row);
    },
    [`store:${slug}`],
    { tags: [`store:${slug}`], revalidate: 86400 }
  )();
}

// Narrow write for the monthly-frozen SEO discount snapshot (see
// lib/content/storeSeoSnapshot.ts) — touches only these 2 columns, never
// exposed through the admin edit form/AdminStoreFields. Not purged via
// purgeTag: only the store page reads these fields (through getStoreBySlug),
// and that page only re-renders when its own ISR cache is stale/purged by an
// actual admin edit — this write doesn't need to force an extra refresh.
export async function updateStoreSeoDiscountSnapshot(
  id: string,
  snapshot: { discountLabel: string | null; period: string }
): Promise<void> {
  await prisma.store.update({
    where: { id },
    data: {
      seoDiscountSnapshot: snapshot.discountLabel,
      seoDiscountSnapshotPeriod: snapshot.period,
    },
  });
}

// Unfiltered lookup by id — used by admin editing and internal flows
// (affiliate redirect, coupon detail) that must resolve a store even if
// it's currently toggled off from public listings.
export async function getStoreById(id: string): Promise<Store | undefined> {
  const row = await prisma.store.findUnique({ where: { id } });
  return row ? toStore(row) : undefined;
}

export async function getStoresByIds(ids: string[]): Promise<Store[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.store.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  const map = new Map(rows.map((row) => [row.id, toStore(row)]));
  return ids.map((id) => map.get(id)).filter((s): s is Store => Boolean(s));
}

export async function getStoresByCategory(categoryId: string): Promise<Store[]> {
  const rows = await prisma.store.findMany({
    where: { isActive: true, categoryIds: { has: categoryId } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toStore);
}

export async function getRelatedStores(store: Store, limit = 4): Promise<Store[]> {
  if (store.categoryIds.length === 0) return [];
  const rows = await prisma.store.findMany({
    where: {
      isActive: true,
      id: { not: store.id },
      categoryIds: { hasSome: store.categoryIds },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toStore);
}

export async function searchStores(
  query: string,
  opts: { take?: number; nameStartsWith?: boolean } = {}
): Promise<Store[]> {
  const q = query.trim();
  if (!q) return getStores();
  const rows = await prisma.store.findMany({
    where: {
      isActive: true,
      // Autocomplete (nameStartsWith) only wants type-ahead suggestions —
      // matching on name prefix at the DB level, not "contains" — otherwise
      // `take` truncates the result set before alphabetically-later prefix
      // matches (e.g. "The Wizards Box") ever get a chance to appear,
      // since stores with "the" merely somewhere in their name/description
      // fill the quota first.
      ...(opts.nameStartsWith
        ? { name: { startsWith: q, mode: "insensitive" as const } }
        : {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }),
    },
    orderBy: { name: "asc" },
    take: opts.take ?? 50,
  });
  return rows.map(toStore);
}

export async function setStoreFeatured(id: string, isFeatured: boolean): Promise<Store> {
  const row = await prisma.store.update({
    where: { id },
    data: { isFeatured },
  });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
  return toStore(row);
}

export async function setStorePinned(id: string, isPin: boolean): Promise<Store> {
  const row = await prisma.store.update({
    where: { id },
    data: { isPin },
  });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
  return toStore(row);
}

// Toggling a store's Status cascades to its coupons: hiding the store hides
// every one of its coupons, reactivating it only reactivates coupons that
// haven't expired (expiresAt null or in the future) — an expired coupon
// stays Hidden even after its store comes back Active.
export async function setStoreActive(id: string, isActive: boolean): Promise<Store> {
  const row = await prisma.store.update({
    where: { id },
    data: { isActive },
  });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);

  const affectedCoupons = await prisma.coupon.findMany({
    where: isActive
      ? { storeId: id, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }
      : { storeId: id },
    select: { id: true, slug: true, exclusive: true },
  });

  if (affectedCoupons.length > 0) {
    await prisma.coupon.updateMany({
      where: { id: { in: affectedCoupons.map((c) => c.id) } },
      data: { isActive },
    });
    purgeTag("coupons:list");
    for (const coupon of affectedCoupons) {
      purgeTag(`coupon:${coupon.slug}`);
      if (isActive) {
        await syncCouponWithStoreEvent({
          id: coupon.id,
          storeId: id,
          exclusive: coupon.exclusive,
          isActive: true,
        });
      }
    }
  }

  // Deals have no expiry concept, so unlike coupons the cascade is
  // unconditional: hiding the store hides all its deals, reactivating it
  // reactivates all of them.
  const affectedDeals = await prisma.deal.findMany({
    where: { storeId: id },
    select: { id: true },
  });
  if (affectedDeals.length > 0) {
    await prisma.deal.updateMany({
      where: { id: { in: affectedDeals.map((d) => d.id) } },
      data: { isActive },
    });
    purgeTag("deals:list");
  }

  return toStore(row);
}

export async function incrementStoreCurrentMonthClicks(id: string): Promise<Store | undefined> {
  try {
    const row = await prisma.store.update({
      where: { id },
      data: { currentMonthClicks: { increment: 1 } },
    });
    return toStore(row);
  } catch {
    return undefined;
  }
}

// Bulk-sets which stores are Featured based on a Popular Stores ranking
// (see lib/content/popularStoresRefresh.ts) — turns on the winners, turns
// off any active store that was Featured but didn't make the cut this time.
// Doesn't purge per-slug store:<slug> tags: the store detail page doesn't
// render anything differently based on isFeatured.
// No purgeTag here: this is shared by the manual "Refresh Popular" admin
// action (safe to purge, runs in a route handler) and the lazy auto-rollover
// that runs inside the home page's own render (revalidateTag is disallowed
// during render) — see lib/content/popularStoresRefresh.ts. The manual path
// purges explicitly itself; the render path relies on stores:list's own
// 300s revalidate window.
export async function applyFeaturedSelection(winnerIds: string[]): Promise<void> {
  await prisma.store.updateMany({
    where: { id: { in: winnerIds } },
    data: { isFeatured: true },
  });
  await prisma.store.updateMany({
    where: { isActive: true, isFeatured: true, id: { notIn: winnerIds } },
    data: { isFeatured: false },
  });
}

// Monthly rollover for the Popular Stores click ranking (see
// lib/content/popularStoresRefresh.ts): freezes this month's running total
// into lastMonthClicks and resets currentMonthClicks to 0 for every store
// (including hidden ones, so click history isn't lost while a store is
// toggled off). Column-to-column, so it needs raw SQL — Prisma's updateMany
// can't reference another column's current value.
export async function rolloverMonthlyClicks(): Promise<void> {
  await prisma.$executeRaw`UPDATE "stores" SET "lastMonthClicks" = "currentMonthClicks", "currentMonthClicks" = 0`;
  // No purgeTag here: this runs lazily inside the home page's own render
  // (see ensurePopularStoresAutoRollover), and revalidateTag is disallowed
  // during render. stores:list already revalidates every 300s on its own,
  // so the rollover's effect on getFeaturedStores() surfaces within that
  // window without needing an explicit purge.
}

// Coupon/Review rows cascade-delete at the DB level (see prisma/schema.prisma
// onDelete: Cascade), and each deleted coupon in turn cascades its
// EventCoupon rows the same way — so the only manual work left here is
// purging cache tags.
export async function deleteStore(id: string): Promise<void> {
  const coupons = await prisma.coupon.findMany({
    where: { storeId: id },
    select: { id: true, slug: true },
  });
  const dealCount = await prisma.deal.count({ where: { storeId: id } });
  const affectedEvents = await prisma.eventCoupon.findMany({
    where: { coupon: { storeId: id } },
    select: { event: { select: { slug: true } } },
    distinct: ["eventId"],
  });

  const row = await prisma.store.delete({ where: { id } });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);

  if (dealCount > 0) purgeTag("deals:list");

  if (coupons.length === 0) return;

  purgeTag("coupons:list");
  for (const coupon of coupons) purgeTag(`coupon:${coupon.slug}`);

  for (const { event } of affectedEvents) purgeTag(`event:${event.slug}`);
  if (affectedEvents.length > 0) purgeTag("events:list");
}

export interface AdminStoreFields {
  slug: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string | null;
  website: string;
  description: string;
  aboutStore: string;
  howToApply?: string | null;
  rating: number;
  ratingCount: number;
  region: StoreRegion;
  affiliateNetwork: string;
  categoryIds: string[];
  isFeatured: boolean;
  isPin: boolean;
  seo: StoreSeo;
  faq: StoreFaqItem[];
}

export async function createStore(fields: AdminStoreFields): Promise<Store> {
  let row: PrismaStore;
  try {
    row = await prisma.store.create({
      data: {
        id: crypto.randomUUID(),
        slug: fields.slug,
        name: fields.name,
        logoUrl: fields.logoUrl,
        bannerUrl: fields.bannerUrl || null,
        website: fields.website,
        description: fields.description,
        aboutStore: fields.aboutStore,
        howToApply: fields.howToApply || null,
        rating: fields.rating,
        ratingCount: fields.ratingCount,
        region: fields.region,
        affiliateNetwork: fields.affiliateNetwork,
        isFeatured: fields.isFeatured,
        isPin: fields.isPin,
        seo: fields.seo as unknown as Prisma.InputJsonValue,
        faq: fields.faq as unknown as Prisma.InputJsonValue,
        categoryIds: fields.categoryIds,
      },
    });
  } catch (error) {
    throwIfSlugConflict(error);
  }
  purgeTag("stores:list");
  return toStore(row);
}

export async function updateStore(id: string, fields: AdminStoreFields): Promise<Store> {
  let row: PrismaStore;
  try {
    row = await prisma.store.update({
      where: { id },
      data: {
        slug: fields.slug,
        name: fields.name,
        logoUrl: fields.logoUrl,
        bannerUrl: fields.bannerUrl || null,
        website: fields.website,
        description: fields.description,
        aboutStore: fields.aboutStore,
        howToApply: fields.howToApply || null,
        rating: fields.rating,
        ratingCount: fields.ratingCount,
        region: fields.region,
        affiliateNetwork: fields.affiliateNetwork,
        isFeatured: fields.isFeatured,
        isPin: fields.isPin,
        seo: fields.seo as unknown as Prisma.InputJsonValue,
        faq: fields.faq as unknown as Prisma.InputJsonValue,
        categoryIds: fields.categoryIds,
      },
    });
  } catch (error) {
    throwIfSlugConflict(error);
  }
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
  return toStore(row);
}

export function groupStoresByLetter(stores: Store[]) {
  const groups = new Map<string, Store[]>();
  for (const store of [...stores].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = /^[a-z]/i.test(store.name[0]) ? store.name[0].toUpperCase() : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(store);
  }
  return groups;
}
