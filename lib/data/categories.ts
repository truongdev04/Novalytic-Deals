import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import { stripUndefined } from "./normalize";
import type { Category, CategoryFaqItem, CategorySeo } from "@/types";
import type { Category as PrismaCategory } from "@prisma/client";

function toCategory(row: PrismaCategory): Category {
  return stripUndefined({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    iconName: row.iconName || undefined,
    iconImageUrl: row.iconImageUrl ?? undefined,
    parentId: row.parentId ?? undefined,
    isFeatured: row.isFeatured,
    seo: row.seo as unknown as CategorySeo,
    faq: row.faq as unknown as CategoryFaqItem[],
    createdAt: row.createdAt.toISOString(),
  });
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const rows = await prisma.category.findMany({
      orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
    });
    return rows.map(toCategory);
  },
  ["categories:list"],
  { tags: ["categories:list"], revalidate: 300 }
);

export interface AdminCategoryFilters {
  createdById?: string;
}

// Admin-only, ownership-scoped counterpart to getCategories() above — used
// exclusively by the admin list page so a data-scoped editor only sees their
// own categories. getCategories() itself stays unfiltered/untouched since
// other pages (category pickers on Store/Deal/Blog forms) rely on it
// returning every category regardless of who's logged in.
export async function getCategoriesAdmin(filters: AdminCategoryFilters = {}): Promise<Category[]> {
  const scopeKey = filters.createdById ?? "all";
  return unstable_cache(
    async () => {
      const rows = await prisma.category.findMany({
        where: filters.createdById ? { createdById: filters.createdById } : undefined,
        orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
      });
      return rows.map(toCategory);
    },
    [`categories:list:${scopeKey}`],
    { tags: ["categories:list"], revalidate: 300 }
  )();
}

export const getFeaturedCategories = unstable_cache(
  async (limit = 8): Promise<Category[]> => {
    const rows = await prisma.category.findMany({
      where: { isFeatured: true },
      orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
      take: limit,
    });
    return rows.map(toCategory);
  },
  ["categories:featured"],
  { tags: ["categories:list"], revalidate: 300 }
);

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.category.findUnique({ where: { slug } });
      return row ? toCategory(row) : undefined;
    },
    [`category:${slug}`],
    { tags: [`category:${slug}`], revalidate: 300 }
  )();
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const row = await prisma.category.findUnique({ where: { id } });
  return row ? toCategory(row) : undefined;
}

export async function getCategoryOwnerId(id: string): Promise<string | undefined> {
  const row = await prisma.category.findUnique({ where: { id }, select: { createdById: true } });
  return row?.createdById ?? undefined;
}

export interface AdminCategoryFields {
  slug: string;
  name: string;
  description: string;
  iconName?: string | null;
  iconImageUrl?: string | null;
  parentId?: string | null;
  isFeatured: boolean;
  seo: CategorySeo;
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

export interface AdminCategoryCreateFields extends AdminCategoryFields {
  createdById: string;
}

export async function createCategory(fields: AdminCategoryCreateFields): Promise<Category> {
  try {
    const row = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        slug: fields.slug,
        name: fields.name,
        description: fields.description,
        iconName: fields.iconName || "",
        iconImageUrl: fields.iconImageUrl || null,
        parentId: fields.parentId || null,
        isFeatured: fields.isFeatured,
        seo: fields.seo as unknown as Prisma.InputJsonValue,
        faq: [] as unknown as Prisma.InputJsonValue,
        createdById: fields.createdById,
      },
    });
    purgeTag("categories:list");
    return toCategory(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}

export async function updateCategory(
  id: string,
  fields: AdminCategoryFields
): Promise<Category> {
  const previous = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
  try {
    const row = await prisma.category.update({
      where: { id },
      data: {
        slug: fields.slug,
        name: fields.name,
        description: fields.description,
        iconName: fields.iconName || "",
        iconImageUrl: fields.iconImageUrl || null,
        parentId: fields.parentId || null,
        isFeatured: fields.isFeatured,
        seo: fields.seo as unknown as Prisma.InputJsonValue,
      },
    });
    purgeTag("categories:list");
    purgeTag(`category:${row.slug}`);
    if (previous && previous.slug !== row.slug) {
      purgeTag(`category:${previous.slug}`);
    }
    return toCategory(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}

export async function setCategoryFeatured(id: string, isFeatured: boolean): Promise<Category> {
  const row = await prisma.category.update({ where: { id }, data: { isFeatured } });
  purgeTag("categories:list");
  purgeTag(`category:${row.slug}`);
  return toCategory(row);
}

export async function deleteCategory(id: string): Promise<void> {
  const storeCount = await prisma.store.count({ where: { categoryIds: { has: id } } });
  if (storeCount > 0) {
    throw new Error("CATEGORY_IN_USE");
  }

  const row = await prisma.category.delete({ where: { id } });
  purgeTag("categories:list");
  purgeTag(`category:${row.slug}`);
}
