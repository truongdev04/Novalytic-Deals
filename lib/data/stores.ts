import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { Store, StoreFaqItem, StoreRegion, StoreSeo } from "@/types";
import type { Store as PrismaStore, StoreCategory } from "@prisma/client";

type StoreRow = PrismaStore & { categories: StoreCategory[] };

function toStore(row: StoreRow): Store {
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
    categoryIds: row.categories.map((c) => c.categoryId),
    region: row.region,
    affiliateNetwork: row.affiliateNetwork,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    clickCount: row.clickCount,
    seo: row.seo as unknown as StoreSeo,
    faq: row.faq as unknown as StoreFaqItem[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const getAllStoresCached = unstable_cache(
  async (): Promise<Store[]> => {
    const rows = await prisma.store.findMany({ include: { categories: true } });
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
      const row = await prisma.store.findUnique({
        where: { slug },
        include: { categories: true },
      });
      if (!row || !row.isActive) return undefined;
      return toStore(row);
    },
    [`store:${slug}`],
    { tags: [`store:${slug}`], revalidate: 300 }
  )();
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
    include: { categories: true },
  });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
  return toStore(row);
}

export async function setStoreActive(id: string, isActive: boolean): Promise<Store> {
  const row = await prisma.store.update({
    where: { id },
    data: { isActive },
    include: { categories: true },
  });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
  return toStore(row);
}

export async function incrementStoreClickCount(id: string): Promise<Store | undefined> {
  try {
    const row = await prisma.store.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
      include: { categories: true },
    });
    return toStore(row);
  } catch {
    return undefined;
  }
}

export async function deleteStore(id: string): Promise<void> {
  const row = await prisma.store.delete({ where: { id } });
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
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
  const row = await prisma.store.create({
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
      categories: { create: fields.categoryIds.map((categoryId) => ({ categoryId })) },
    },
    include: { categories: true },
  });
  purgeTag("stores:list");
  return toStore(row);
}

export async function updateStore(id: string, fields: AdminStoreFields): Promise<Store> {
  const row = await prisma.$transaction(async (tx) => {
    await tx.storeCategory.deleteMany({ where: { storeId: id } });
    return tx.store.update({
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
        categories: { create: fields.categoryIds.map((categoryId) => ({ categoryId })) },
      },
      include: { categories: true },
    });
  });
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
