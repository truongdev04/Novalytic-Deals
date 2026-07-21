import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { Coupon } from "@/types";
import type { Coupon as PrismaCoupon } from "@prisma/client";
import { getStoreBySlug } from "./stores";
import { syncCouponWithStoreEvent } from "./events";
import { getContentConfigSettings } from "./settings";
import { isExpired, seededShuffle } from "@/lib/utils";

function toCoupon(row: PrismaCoupon): Coupon {
  return {
    id: row.id,
    slug: row.slug,
    storeId: row.storeId,
    title: row.title,
    description: row.description,
    type: row.type,
    code: row.code ?? undefined,
    discountType: row.discountType,
    discountValue: row.discountValue,
    currency: row.currency,
    affiliateUrl: row.affiliateUrl,
    exclusive: row.exclusive,
    verified: row.verified,
    verifiedAt: row.verifiedAt?.toISOString(),
    terms: row.terms,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString(),
    usageCount: row.usageCount,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    isFeatured: row.isFeatured,
    isTrending: row.isTrending,
    isActive: row.isActive,
    currentHourClicks: row.currentHourClicks,
    lastHourClicks: row.lastHourClicks,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface CouponFilters {
  storeSlug?: string;
  categoryId?: string;
  type?: Coupon["type"];
  query?: string;
  sort?: "relevance" | "expiring" | "newest" | "discount";
  includeExpired?: boolean;
  // Caps the result count for non-paginated callers (e.g. quick-search) —
  // use filterCouponsPaginated instead when a real page/total is needed.
  limit?: number;
}

// Coupons have no background job to flip their status the instant they
// expire, so this runs on every cache miss instead — piggybacking on the
// existing 5-minute revalidate/purge cycle rather than adding new infra.
// If any of the expiring coupons was currently Trending, backfill
// immediately rather than waiting for the next manual/8h refresh.
async function expireOverdueCoupons(): Promise<void> {
  const now = new Date();
  const expiredTrendingCount = await prisma.coupon.count({
    where: { isActive: true, expiresAt: { lt: now }, isTrending: true },
  });

  await prisma.coupon.updateMany({
    where: { isActive: true, expiresAt: { lt: now } },
    data: { isActive: false, isFeatured: false, isTrending: false },
  });

  if (expiredTrendingCount > 0) {
    await refreshTrendingCoupons();
  }
}

// Every public coupon getter used to inherit this tick for free by routing
// through getAllCouponsCached(). Now that the public getters query the
// active-only table directly (to avoid pulling every coupon into memory),
// each one must call this explicitly instead — cached so the underlying
// updateMany still runs at most once per revalidate window / purge, exactly
// like before.
const ensureCouponsExpired = unstable_cache(
  async (): Promise<number> => {
    await expireOverdueCoupons();
    return Date.now();
  },
  ["coupons:expiry-tick"],
  { tags: ["coupons:list"], revalidate: 300 }
);

// Pure ranking: every eligible coupon (verified, not exclusive, not expired)
// competes for a slot, but only the single best coupon per store advances —
// "1 mã / store" — ranked by lastHourClicks (ties broken by createdAt desc,
// matching rankDealsByClicks/rankPopularStores).
function rankCouponsByClicks(coupons: Coupon[], limit: number): string[] {
  const eligible = coupons.filter(
    (c) => c.verified && !c.exclusive && !isExpired(c.expiresAt)
  );

  const bestPerStore = new Map<string, Coupon>();
  for (const c of eligible) {
    const current = bestPerStore.get(c.storeId);
    if (
      !current ||
      c.lastHourClicks > current.lastHourClicks ||
      (c.lastHourClicks === current.lastHourClicks &&
        new Date(c.createdAt).getTime() > new Date(current.createdAt).getTime())
    ) {
      bestPerStore.set(c.storeId, c);
    }
  }

  const winners = [...bestPerStore.values()].sort((a, b) => {
    const diff = b.lastHourClicks - a.lastHourClicks;
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return winners.slice(0, limit).map((c) => c.id);
}

export async function applyCouponTrendingSelection(winnerIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.coupon.updateMany({
      where: {
        isActive: true,
        isTrending: true,
        id: { notIn: winnerIds.length ? winnerIds : [""] },
      },
      data: { isTrending: false },
    }),
    prisma.coupon.updateMany({
      where: { id: { in: winnerIds } },
      data: { isTrending: true },
    }),
  ]);
}

// Only the coupons that could possibly win a Trending slot — narrower than
// getCoupons() (skips unverified/exclusive/expired rows at the DB level)
// and, unlike getCoupons(), does NOT call ensureCouponsExpired() itself:
// this is invoked from inside expireOverdueCoupons/ensureCouponsExpired, so
// calling back into it here would re-enter the same cache key mid-populate.
async function getTrendingCandidateCoupons(): Promise<Coupon[]> {
  const rows = await prisma.coupon.findMany({
    where: {
      isActive: true,
      verified: true,
      exclusive: false,
      ...notExpiredWhere(new Date()),
    },
  });
  return rows.map(toCoupon);
}

// Single place "recompute Trending" lives — used by the expiry backfill
// above, the manual "Refresh Coupon" action, and the 8h Auto Coupon
// rollover (both in lib/content/couponsRefresh.ts).
export async function refreshTrendingCoupons(): Promise<void> {
  const [coupons, config] = await Promise.all([
    getTrendingCandidateCoupons(),
    getContentConfigSettings(),
  ]);
  const winnerIds = rankCouponsByClicks(coupons, config.pagination.trendingDealsCount);
  await applyCouponTrendingSelection(winnerIds);
}

export async function incrementCouponCurrentHourClicks(id: string): Promise<Coupon | undefined> {
  try {
    const row = await prisma.coupon.update({
      where: { id },
      data: { currentHourClicks: { increment: 1 } },
    });
    return toCoupon(row);
  } catch {
    return undefined;
  }
}

export async function rolloverHourlyCouponClicks(): Promise<void> {
  await prisma.$executeRaw`UPDATE "coupons" SET "lastHourClicks" = "currentHourClicks", "currentHourClicks" = 0`;
}

const getAllCouponsCached = unstable_cache(
  async (): Promise<Coupon[]> => {
    await expireOverdueCoupons();
    const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toCoupon);
  },
  ["coupons:list"],
  { tags: ["coupons:list"], revalidate: 300 }
);

// Unfiltered — includes coupons toggled off ("Status") for admin management.
// Public pages must use `getCoupons` (or a helper built on it) instead.
export async function getAllCoupons(): Promise<Coupon[]> {
  return getAllCouponsCached();
}

// Own query (not derived from getAllCouponsCached) so the public path never
// pulls inactive coupons into memory. Same tag as getAllCouponsCached so
// existing purgeTag("coupons:list") calls invalidate both; distinct
// keyParts keep the two cache entries separate.
const getActiveCouponsCached = unstable_cache(
  async (): Promise<Coupon[]> => {
    const rows = await prisma.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCoupon);
  },
  ["coupons:active"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export async function getCoupons(): Promise<Coupon[]> {
  await ensureCouponsExpired();
  return getActiveCouponsCached();
}

export async function getCouponBySlug(slug: string): Promise<Coupon | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.coupon.findUnique({ where: { slug } });
      if (!row || !row.isActive) return undefined;
      return toCoupon(row);
    },
    [`coupon:${slug}`],
    { tags: [`coupon:${slug}`], revalidate: 300 }
  )();
}

// No expiry predicate — the store page needs every active coupon (including
// active-but-expired ones) to compute totalCoupons vs activeCoupons.
export async function getCouponsByStore(storeId: string): Promise<Coupon[]> {
  await ensureCouponsExpired();
  const rows = await prisma.coupon.findMany({
    where: { isActive: true, storeId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toCoupon);
}

// Unfiltered lookup by id — used by admin editing and internal flows
// (affiliate redirect) that must resolve a coupon even if it's currently
// toggled off from public listings.
export async function getCouponById(id: string): Promise<Coupon | undefined> {
  const row = await prisma.coupon.findUnique({ where: { id } });
  return row ? toCoupon(row) : undefined;
}

// isExpired() treats a null expiresAt as "not expired" and expires only when
// expiresAt < now — so "not expired" in Prisma terms is expiresAt null OR
// expiresAt >= now (gte, not gt).
function notExpiredWhere(now: Date): Prisma.CouponWhereInput {
  return { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] };
}

export const getFeaturedCoupons = unstable_cache(
  async (limit = 6): Promise<Coupon[]> => {
    await ensureCouponsExpired();
    const rows = await prisma.coupon.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        verified: true,
        exclusive: false,
        ...notExpiredWhere(new Date()),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toCoupon);
  },
  ["coupons:featured"],
  { tags: ["coupons:list"], revalidate: 300 }
);

// Trending is fully system-managed (see refreshTrendingCoupons /
// applyCouponTrendingSelection) — a coupon is only ever isTrending while it
// still satisfies verified && !exclusive && !expired, so no need to
// re-check those here, mirroring getFeaturedDeals' isFeatured && isActive.
export const getTrendingCoupons = unstable_cache(
  async (limit = 6): Promise<Coupon[]> => {
    await ensureCouponsExpired();
    const rows = await prisma.coupon.findMany({
      where: { isActive: true, isTrending: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toCoupon);
  },
  ["coupons:trending"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export const getExclusiveCoupons = unstable_cache(
  async (limit = 6): Promise<Coupon[]> => {
    await ensureCouponsExpired();
    const rows = await prisma.coupon.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        exclusive: true,
        verified: true,
        ...notExpiredWhere(new Date()),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toCoupon);
  },
  ["coupons:exclusive"],
  { tags: ["coupons:list"], revalidate: 300 }
);

// One slot per store — keeps the section from being dominated by a single
// store that happens to have many coupons, since a visitor already sees
// that store's full list on its own store page.
function dedupeByStore(coupons: Coupon[]): Coupon[] {
  const seenStoreIds = new Set<string>();
  const result: Coupon[] = [];
  for (const coupon of coupons) {
    if (seenStoreIds.has(coupon.storeId)) continue;
    seenStoreIds.add(coupon.storeId);
    result.push(coupon);
  }
  return result;
}

// "Best {Category} Coupon" section on the category page — a random-looking
// but stable selection that only reshuffles once a month. The UTC period
// (e.g. "2026-07") is passed in as a cache-key argument by the caller, so
// unstable_cache naturally recomputes on the first request after 00:00 UTC
// on the 1st (new period ⇒ new key ⇒ cache miss) and freezes in between,
// mirroring the lazy-rollover pattern in lib/content/*Refresh.ts without
// needing a persisted selection or a cron job.
export const getBestCategoryCoupons = unstable_cache(
  async (categoryId: string, period: string, limit = 20): Promise<Coupon[]> => {
    const coupons = await filterCoupons({ categoryId });
    const exclusive = seededShuffle(
      coupons.filter((c) => c.exclusive),
      `${categoryId}:${period}:exclusive`
    );
    const rest = seededShuffle(
      coupons.filter((c) => !c.exclusive),
      `${categoryId}:${period}:rest`
    );
    // Dedupe across the full combined list before slicing, so the limit
    // reflects unique stores rather than being front-loaded by whichever
    // store's coupons happened to shuffle to the top.
    return dedupeByStore([...exclusive, ...rest]).slice(0, limit);
  },
  ["coupons:best-by-category"],
  { tags: ["coupons:list"], revalidate: false }
);

async function buildCouponWhere(filters: CouponFilters): Promise<Prisma.CouponWhereInput> {
  const where: Prisma.CouponWhereInput = { isActive: true };
  const and: Prisma.CouponWhereInput[] = [];

  if (!filters.includeExpired) {
    and.push(notExpiredWhere(new Date()));
  }

  if (filters.storeSlug) {
    const store = await getStoreBySlug(filters.storeSlug);
    // No match ⇒ sentinel id that can never exist, so the query returns
    // zero rows (mirrors the old `c.storeId === store?.id` behavior).
    where.storeId = store?.id ?? "__no_match__";
  }

  if (filters.categoryId) {
    where.store = { isActive: true, categoryIds: { has: filters.categoryId } };
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const q = filters.query?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

// Every branch carries a createdAt-desc tiebreaker to match the stable JS
// sort the old implementation ran on a createdAt-desc source array.
function buildCouponOrderBy(
  sort: CouponFilters["sort"]
): Prisma.CouponOrderByWithRelationInput[] {
  switch (sort) {
    case "expiring":
      return [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "discount":
      return [{ discountValue: "desc" }, { createdAt: "desc" }];
    default:
      return [{ upvotes: "desc" }, { createdAt: "desc" }];
  }
}

export async function filterCoupons(filters: CouponFilters = {}): Promise<Coupon[]> {
  await ensureCouponsExpired();
  const rows = await prisma.coupon.findMany({
    where: await buildCouponWhere(filters),
    orderBy: buildCouponOrderBy(filters.sort),
    take: filters.limit,
  });
  return rows.map(toCoupon);
}

// Same filtering as filterCoupons but with real DB-level pagination — used
// where the caller needs an accurate `total` for a page count (e.g. /deals),
// instead of fetching everything and slicing in JS.
export async function filterCouponsPaginated(
  filters: CouponFilters,
  page: number,
  pageSize: number
): Promise<{ items: Coupon[]; total: number }> {
  await ensureCouponsExpired();
  const where = await buildCouponWhere(filters);
  const [rows, total] = await prisma.$transaction([
    prisma.coupon.findMany({
      where,
      orderBy: buildCouponOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.coupon.count({ where }),
  ]);
  return { items: rows.map(toCoupon), total };
}

export interface AdminCouponFilters {
  storeId?: string;
  type?: Coupon["type"];
  query?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  verified?: boolean;
  exclusive?: boolean;
}

// Admin-facing paginated list — unlike filterCoupons/filterCouponsPaginated
// (public), this does NOT force isActive:true or an expiry predicate: the
// admin table needs to see hidden/expired rows too, with status as just
// another optional filter.
export async function getCouponsAdminPaginated(
  filters: AdminCouponFilters,
  page: number,
  pageSize: number
): Promise<{ items: Coupon[]; total: number }> {
  const where: Prisma.CouponWhereInput = {};
  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.type) where.type = filters.type;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.verified !== undefined) where.verified = filters.verified;
  if (filters.exclusive !== undefined) where.exclusive = filters.exclusive;

  const q = filters.query?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { store: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.coupon.count({ where }),
  ]);
  return { items: rows.map(toCoupon), total };
}

export async function getRelatedCoupons(coupon: Coupon, limit = 4): Promise<Coupon[]> {
  await ensureCouponsExpired();
  const rows = await prisma.coupon.findMany({
    where: {
      isActive: true,
      id: { not: coupon.id },
      storeId: coupon.storeId,
      ...notExpiredWhere(new Date()),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toCoupon);
}

export async function getCouponsByIds(ids: string[]): Promise<Coupon[]> {
  if (ids.length === 0) return [];
  await ensureCouponsExpired();
  const rows = await prisma.coupon.findMany({
    where: { isActive: true, id: { in: ids } },
  });
  const map = new Map(rows.map((row) => [row.id, toCoupon(row)]));
  return ids.map((id) => map.get(id)).filter((c): c is Coupon => Boolean(c));
}

// Aggregate helpers — replace the old pattern of fetching every active
// coupon into memory just to count occurrences in JS.
export async function getVerifiedCouponCountByStoreIds(
  storeIds: string[]
): Promise<Record<string, number>> {
  if (storeIds.length === 0) return {};
  const groups = await prisma.coupon.groupBy({
    by: ["storeId"],
    where: { isActive: true, verified: true, storeId: { in: storeIds } },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.storeId, g._count._all]));
}

// Category isn't a direct column on Coupon (only on its Store), so this
// fans out through Store.categoryIds with a raw aggregate query instead of
// pulling every active coupon row into JS to count in memory.
export async function getActiveCouponCountByCategory(): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ categoryId: string; count: bigint }[]>`
    SELECT unnest(s."categoryIds") AS "categoryId", COUNT(*)::bigint AS count
    FROM coupons c
    JOIN stores s ON c."storeId" = s.id
    WHERE c."isActive" = true AND s."isActive" = true
    GROUP BY 1
  `;
  return Object.fromEntries(rows.map((r) => [r.categoryId, Number(r.count)]));
}

export async function incrementCouponVote(
  id: string,
  direction: "up" | "down"
): Promise<Coupon | undefined> {
  try {
    const row = await prisma.coupon.update({
      where: { id },
      data: direction === "up" ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
    });
    return toCoupon(row);
  } catch {
    return undefined;
  }
}

export async function incrementCouponUsage(id: string): Promise<Coupon | undefined> {
  try {
    const row = await prisma.coupon.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
    return toCoupon(row);
  } catch {
    return undefined;
  }
}

export async function setCouponFeatured(id: string, isFeatured: boolean): Promise<Coupon> {
  const row = await prisma.coupon.update({ where: { id }, data: { isFeatured } });
  purgeTag("coupons:list");
  purgeTag(`coupon:${row.slug}`);
  return toCoupon(row);
}

export async function setCouponVerified(id: string, verified: boolean): Promise<Coupon> {
  const row = await prisma.coupon.update({
    where: { id },
    data: { verified, verifiedAt: verified ? new Date() : null },
  });
  purgeTag("coupons:list");
  purgeTag(`coupon:${row.slug}`);
  return toCoupon(row);
}

export async function setCouponActive(id: string, isActive: boolean): Promise<Coupon> {
  if (isActive) {
    const existing = await prisma.coupon.findUnique({ where: { id }, include: { store: true } });
    if (!existing) throw new Error("COUPON_NOT_FOUND");
    if (existing.expiresAt && existing.expiresAt < new Date()) {
      throw new Error("COUPON_EXPIRED");
    }
    if (!existing.store.isActive) {
      throw new Error("STORE_INACTIVE");
    }
  }

  const row = await prisma.coupon.update({ where: { id }, data: { isActive } });
  purgeTag("coupons:list");
  purgeTag(`coupon:${row.slug}`);
  await syncCouponWithStoreEvent(row);
  return toCoupon(row);
}

export async function deleteCoupon(id: string): Promise<void> {
  const row = await prisma.coupon.delete({ where: { id } });
  purgeTag("coupons:list");
  purgeTag(`coupon:${row.slug}`);
}

export interface AdminCouponFields {
  storeId: string;
  slug: string;
  title: string;
  description: string;
  type: Coupon["type"];
  code?: string | null;
  discountType: Coupon["discountType"];
  discountValue: number;
  currency: string;
  affiliateUrl: string;
  exclusive: boolean;
  verified: boolean;
  terms: string;
  startsAt: Date;
  expiresAt?: Date | null;
  isFeatured: boolean;
}

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

export async function createCoupon(fields: AdminCouponFields): Promise<Coupon> {
  try {
    const row = await prisma.coupon.create({
      data: {
        id: crypto.randomUUID(),
        storeId: fields.storeId,
        slug: fields.slug,
        title: fields.title,
        description: fields.description,
        type: fields.type,
        code: fields.code || null,
        discountType: fields.discountType,
        discountValue: fields.discountValue,
        currency: fields.currency,
        affiliateUrl: fields.affiliateUrl,
        exclusive: fields.exclusive,
        verified: fields.verified,
        verifiedAt: fields.verified ? new Date() : null,
        terms: fields.terms,
        startsAt: fields.startsAt,
        expiresAt: fields.expiresAt || null,
        isFeatured: fields.isFeatured,
      },
    });
    purgeTag("coupons:list");
    await syncCouponWithStoreEvent(row);
    return toCoupon(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}

export async function updateCoupon(id: string, fields: AdminCouponFields): Promise<Coupon> {
  try {
    const existing = await prisma.coupon.findUnique({
      where: { id },
      select: { verified: true, verifiedAt: true },
    });
    const verifiedAt = fields.verified
      ? existing?.verified
        ? existing.verifiedAt
        : new Date()
      : null;

    const row = await prisma.coupon.update({
      where: { id },
      data: {
        storeId: fields.storeId,
        slug: fields.slug,
        title: fields.title,
        description: fields.description,
        type: fields.type,
        code: fields.code || null,
        discountType: fields.discountType,
        discountValue: fields.discountValue,
        currency: fields.currency,
        affiliateUrl: fields.affiliateUrl,
        exclusive: fields.exclusive,
        verified: fields.verified,
        verifiedAt,
        terms: fields.terms,
        startsAt: fields.startsAt,
        expiresAt: fields.expiresAt || null,
        isFeatured: fields.isFeatured,
      },
    });
    purgeTag("coupons:list");
    purgeTag(`coupon:${row.slug}`);
    await syncCouponWithStoreEvent(row);
    return toCoupon(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}
