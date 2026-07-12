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
    isActive: row.isActive,
    clickCount: row.clickCount,
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

export async function getStores(): Promise<Store[]> {
  const all = await getAllStoresCached();
  return all.filter((s) => s.isActive);
}

export const getFeaturedStores = unstable_cache(
  async (limit = 8): Promise<Store[]> => {
    const all = await getStores();
    return all.filter((s) => s.isFeatured).slice(0, limit);
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
  const all = await getAllStores();
  return all.find((s) => s.id === id);
}

export async function getStoresByIds(ids: string[]): Promise<Store[]> {
  const all = await getStores();
  const map = new Map(all.map((s) => [s.id, s]));
  return ids.map((id) => map.get(id)).filter((s): s is Store => Boolean(s));
}

export async function getStoresByCategory(categoryId: string): Promise<Store[]> {
  const all = await getStores();
  return all.filter((s) => s.categoryIds.includes(categoryId));
}

export async function getRelatedStores(store: Store, limit = 4): Promise<Store[]> {
  const all = await getStores();
  return all
    .filter(
      (s) =>
        s.id !== store.id &&
        s.categoryIds.some((id) => store.categoryIds.includes(id))
    )
    .slice(0, limit);
}

export async function searchStores(query: string): Promise<Store[]> {
  const q = query.trim().toLowerCase();
  const all = await getStores();
  if (!q) return all;
  return all.filter(
    (s) =>
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );
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

export async function incrementStoreClickCount(id: string): Promise<Store | undefined> {
  try {
    const row = await prisma.store.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
    return toStore(row);
  } catch {
    return undefined;
  }
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
