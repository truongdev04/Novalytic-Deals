import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { Coupon } from "@/types";
import type { Coupon as PrismaCoupon } from "@prisma/client";
import { getStoreBySlug, getStoresByCategory } from "./stores";
import { syncCouponWithStoreEvent } from "./events";
import { isExpired } from "@/lib/utils";

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
}

// Coupons have no background job to flip their status the instant they
// expire, so this runs on every cache miss instead — piggybacking on the
// existing 5-minute revalidate/purge cycle rather than adding new infra.
async function expireOverdueCoupons(): Promise<void> {
  await prisma.coupon.updateMany({
    where: { isActive: true, expiresAt: { lt: new Date() } },
    data: { isActive: false, isFeatured: false },
  });
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

export async function getCoupons(): Promise<Coupon[]> {
  const all = await getAllCouponsCached();
  return all.filter((c) => c.isActive);
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

export async function getCouponsByStore(storeId: string): Promise<Coupon[]> {
  const all = await getCoupons();
  return all.filter((c) => c.storeId === storeId);
}

// Unfiltered lookup by id — used by admin editing and internal flows
// (affiliate redirect) that must resolve a coupon even if it's currently
// toggled off from public listings.
export async function getCouponById(id: string): Promise<Coupon | undefined> {
  const row = await prisma.coupon.findUnique({ where: { id } });
  return row ? toCoupon(row) : undefined;
}

export const getFeaturedCoupons = unstable_cache(
  async (limit = 6): Promise<Coupon[]> => {
    const all = await getCoupons();
    return all
      .filter((c) => c.isFeatured && c.verified && !c.exclusive && !isExpired(c.expiresAt))
      .slice(0, limit);
  },
  ["coupons:featured"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export const getExclusiveCoupons = unstable_cache(
  async (limit = 6): Promise<Coupon[]> => {
    const all = await getCoupons();
    return all
      .filter((c) => c.isFeatured && c.exclusive && c.verified && !isExpired(c.expiresAt))
      .slice(0, limit);
  },
  ["coupons:exclusive"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export async function filterCoupons(filters: CouponFilters = {}): Promise<Coupon[]> {
  let result = await getCoupons();

  if (!filters.includeExpired) {
    result = result.filter((c) => !isExpired(c.expiresAt));
  }

  if (filters.storeSlug) {
    const store = await getStoreBySlug(filters.storeSlug);
    result = result.filter((c) => c.storeId === store?.id);
  }

  if (filters.categoryId) {
    const stores = await getStoresByCategory(filters.categoryId);
    const storeIds = new Set(stores.map((s) => s.id));
    result = result.filter((c) => storeIds.has(c.storeId));
  }

  if (filters.type) {
    result = result.filter((c) => c.type === filters.type);
  }

  if (filters.query) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }

  switch (filters.sort) {
    case "expiring":
      result.sort(
        (a, b) =>
          new Date(a.expiresAt ?? "9999-12-31").getTime() -
          new Date(b.expiresAt ?? "9999-12-31").getTime()
      );
      break;
    case "newest":
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "discount":
      result.sort((a, b) => b.discountValue - a.discountValue);
      break;
    default:
      result.sort((a, b) => b.upvotes - a.upvotes);
  }

  return result;
}

export async function getRelatedCoupons(coupon: Coupon, limit = 4): Promise<Coupon[]> {
  const all = await getCoupons();
  return all
    .filter((c) => c.id !== coupon.id && c.storeId === coupon.storeId && !isExpired(c.expiresAt))
    .slice(0, limit);
}

export async function getCouponsByIds(ids: string[]): Promise<Coupon[]> {
  const all = await getCoupons();
  const map = new Map(all.map((c) => [c.id, c]));
  return ids.map((id) => map.get(id)).filter((c): c is Coupon => Boolean(c));
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
  isTrending: boolean;
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
        isTrending: fields.isTrending,
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
        isTrending: fields.isTrending,
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
