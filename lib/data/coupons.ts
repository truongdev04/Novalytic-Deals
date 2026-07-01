import { unstable_cache } from "next/cache";
import couponsData from "@/data/coupons.json";
import type { Coupon } from "@/types";
import { getStoreBySlug, getStoresByCategory } from "./stores";
import { isExpired } from "@/lib/utils";

const allCoupons = couponsData as Coupon[];

export interface CouponFilters {
  storeSlug?: string;
  categoryId?: string;
  type?: Coupon["type"];
  query?: string;
  sort?: "relevance" | "expiring" | "newest" | "discount";
  includeExpired?: boolean;
}

export const getCoupons = unstable_cache(
  async (): Promise<Coupon[]> => allCoupons,
  ["coupons:list"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export async function getCouponBySlug(slug: string): Promise<Coupon | undefined> {
  return unstable_cache(
    async () => allCoupons.find((c) => c.slug === slug),
    [`coupon:${slug}`],
    { tags: [`coupon:${slug}`], revalidate: 300 }
  )();
}

export async function getCouponsByStore(storeId: string): Promise<Coupon[]> {
  return allCoupons.filter((c) => c.storeId === storeId);
}

export const getFeaturedCoupons = unstable_cache(
  async (limit = 6): Promise<Coupon[]> =>
    allCoupons.filter((c) => c.isFeatured && !isExpired(c.expiresAt)).slice(0, limit),
  ["coupons:featured"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export const getTrendingDeals = unstable_cache(
  async (limit = 6): Promise<Coupon[]> =>
    allCoupons.filter((c) => c.isTrending && !isExpired(c.expiresAt)).slice(0, limit),
  ["coupons:trending"],
  { tags: ["coupons:list"], revalidate: 300 }
);

export async function filterCoupons(filters: CouponFilters = {}): Promise<Coupon[]> {
  let result = [...allCoupons];

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
  return allCoupons
    .filter((c) => c.id !== coupon.id && c.storeId === coupon.storeId && !isExpired(c.expiresAt))
    .slice(0, limit);
}

export async function getCouponsByIds(ids: string[]): Promise<Coupon[]> {
  const map = new Map(allCoupons.map((c) => [c.id, c]));
  return ids.map((id) => map.get(id)).filter((c): c is Coupon => Boolean(c));
}
