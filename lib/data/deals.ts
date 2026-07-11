import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { Deal } from "@/types";
import type { Deal as PrismaDeal } from "@prisma/client";

function toDeal(row: PrismaDeal): Deal {
  return {
    id: row.id,
    slug: row.slug,
    storeId: row.storeId,
    name: row.name,
    type: row.type,
    code: row.code ?? undefined,
    eventId: row.eventId,
    categoryId: row.categoryId,
    originalPrice: row.originalPrice ?? undefined,
    price: row.price,
    offer: row.offer ?? undefined,
    url: row.url,
    imageUrl: row.imageUrl,
    description: row.description ?? undefined,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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

const getAllDealsCached = unstable_cache(
  async (): Promise<Deal[]> => {
    const rows = await prisma.deal.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toDeal);
  },
  ["deals:list"],
  { tags: ["deals:list"], revalidate: 300 }
);

export async function getAllDeals(): Promise<Deal[]> {
  return getAllDealsCached();
}

export async function getDealById(id: string): Promise<Deal | undefined> {
  const row = await prisma.deal.findUnique({ where: { id } });
  return row ? toDeal(row) : undefined;
}

export async function setDealFeatured(id: string, isFeatured: boolean): Promise<Deal> {
  const row = await prisma.deal.update({ where: { id }, data: { isFeatured } });
  purgeTag("deals:list");
  return toDeal(row);
}

// Mirrors setCouponActive's STORE_INACTIVE guard — Deal has no expiry concept
// so there's no equivalent of COUPON_EXPIRED to check here.
export async function setDealActive(id: string, isActive: boolean): Promise<Deal> {
  if (isActive) {
    const existing = await prisma.deal.findUnique({ where: { id }, include: { store: true } });
    if (!existing) throw new Error("DEAL_NOT_FOUND");
    if (!existing.store.isActive) throw new Error("STORE_INACTIVE");
  }

  const row = await prisma.deal.update({ where: { id }, data: { isActive } });
  purgeTag("deals:list");
  return toDeal(row);
}

export async function setDealEvent(id: string, eventId: string | null): Promise<Deal> {
  const row = await prisma.deal.update({ where: { id }, data: { eventId } });
  purgeTag("deals:list");
  return toDeal(row);
}

export async function deleteDeal(id: string): Promise<void> {
  await prisma.deal.delete({ where: { id } });
  purgeTag("deals:list");
}

export interface AdminDealFields {
  storeId: string;
  slug: string;
  name: string;
  type: Deal["type"];
  code?: string | null;
  eventId: string | null;
  categoryId: string | null;
  originalPrice?: number | null;
  price: number;
  offer?: string | null;
  url: string;
  imageUrl: string;
  description?: string | null;
  isFeatured: boolean;
}

export async function createDeal(fields: AdminDealFields): Promise<Deal> {
  try {
    const row = await prisma.deal.create({
      data: {
        id: crypto.randomUUID(),
        storeId: fields.storeId,
        slug: fields.slug,
        name: fields.name,
        type: fields.type,
        code: fields.code || null,
        eventId: fields.eventId,
        categoryId: fields.categoryId,
        originalPrice: fields.originalPrice ?? null,
        price: fields.price,
        offer: fields.offer || null,
        url: fields.url,
        imageUrl: fields.imageUrl,
        description: fields.description || null,
        isFeatured: fields.isFeatured,
      },
    });
    purgeTag("deals:list");
    return toDeal(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}

export async function updateDeal(id: string, fields: AdminDealFields): Promise<Deal> {
  try {
    const row = await prisma.deal.update({
      where: { id },
      data: {
        storeId: fields.storeId,
        slug: fields.slug,
        name: fields.name,
        type: fields.type,
        code: fields.code || null,
        eventId: fields.eventId,
        categoryId: fields.categoryId,
        originalPrice: fields.originalPrice ?? null,
        price: fields.price,
        offer: fields.offer || null,
        url: fields.url,
        imageUrl: fields.imageUrl,
        description: fields.description || null,
        isFeatured: fields.isFeatured,
      },
    });
    purgeTag("deals:list");
    return toDeal(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}
