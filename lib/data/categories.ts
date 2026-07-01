import { unstable_cache } from "next/cache";
import categoriesData from "@/data/categories.json";
import type { Category } from "@/types";

const allCategories = categoriesData as Category[];

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => allCategories,
  ["categories:list"],
  { tags: ["categories:list"], revalidate: 300 }
);

export const getFeaturedCategories = unstable_cache(
  async (limit = 8): Promise<Category[]> =>
    allCategories.filter((c) => c.isFeatured).slice(0, limit),
  ["categories:featured"],
  { tags: ["categories:list"], revalidate: 300 }
);

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return unstable_cache(
    async () => allCategories.find((c) => c.slug === slug),
    [`category:${slug}`],
    { tags: [`category:${slug}`], revalidate: 300 }
  )();
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  return allCategories.find((c) => c.id === id);
}
