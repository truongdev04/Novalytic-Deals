"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildQueryUrl } from "@/lib/utils";
import type { Category, Store } from "@/types";

const selectClassName =
  "h-11 rounded-xl border border-muted-300 bg-surface-0 px-4 text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function FilterSidebar({
  categories,
  stores,
}: {
  categories: Category[];
  stores: Store[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    router.push(buildQueryUrl(pathname, searchParams, { [key]: value === "all" ? undefined : value }));
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        aria-label="Filter by category"
        value={searchParams.get("category") ?? "all"}
        onChange={(e) => updateParam("category", e.target.value)}
        className={selectClassName}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by store"
        value={searchParams.get("store") ?? "all"}
        onChange={(e) => updateParam("store", e.target.value)}
        className={selectClassName}
      >
        <option value="all">All stores</option>
        {stores.map((store) => (
          <option key={store.id} value={store.slug}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}
