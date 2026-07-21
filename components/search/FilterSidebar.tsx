"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildQueryUrl } from "@/lib/utils";
import { Dropdown } from "@/components/search/Dropdown";
import type { Category } from "@/types";

export function FilterSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categories.map((category) => ({ value: category.slug, label: category.name })),
  ];

  return (
    <Dropdown
      ariaLabel="Filter by category"
      options={categoryOptions}
      value={searchParams.get("category") ?? "all"}
      onChange={(value) =>
        router.push(buildQueryUrl(pathname, searchParams, { category: value === "all" ? undefined : value }))
      }
      className="w-48"
    />
  );
}
