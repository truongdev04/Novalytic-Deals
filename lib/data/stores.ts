import { unstable_cache } from "next/cache";
import storesData from "@/data/stores.json";
import type { Store } from "@/types";

const allStores = storesData as Store[];

export const getStores = unstable_cache(
  async (): Promise<Store[]> => allStores,
  ["stores:list"],
  { tags: ["stores:list"], revalidate: 300 }
);

export const getFeaturedStores = unstable_cache(
  async (limit = 8): Promise<Store[]> =>
    allStores.filter((s) => s.isFeatured).slice(0, limit),
  ["stores:featured"],
  { tags: ["stores:list"], revalidate: 300 }
);

export async function getStoreBySlug(slug: string): Promise<Store | undefined> {
  return unstable_cache(
    async () => allStores.find((s) => s.slug === slug),
    [`store:${slug}`],
    { tags: [`store:${slug}`], revalidate: 300 }
  )();
}

export async function getStoreById(id: string): Promise<Store | undefined> {
  return allStores.find((s) => s.id === id);
}

export async function getStoresByIds(ids: string[]): Promise<Store[]> {
  const map = new Map(allStores.map((s) => [s.id, s]));
  return ids.map((id) => map.get(id)).filter((s): s is Store => Boolean(s));
}

export async function getStoresByCategory(categoryId: string): Promise<Store[]> {
  return allStores.filter((s) => s.categoryIds.includes(categoryId));
}

export async function getRelatedStores(store: Store, limit = 4): Promise<Store[]> {
  return allStores
    .filter(
      (s) =>
        s.id !== store.id &&
        s.categoryIds.some((id) => store.categoryIds.includes(id))
    )
    .slice(0, limit);
}

export async function searchStores(query: string): Promise<Store[]> {
  const q = query.trim().toLowerCase();
  if (!q) return allStores;
  return allStores.filter(
    (s) =>
      s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );
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
