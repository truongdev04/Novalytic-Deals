"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildQueryUrl } from "@/lib/utils";

const options = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "discount", label: "Highest Discount" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      aria-label="Sort results"
      value={searchParams.get("sort") ?? "relevance"}
      onChange={(e) =>
        router.push(buildQueryUrl(pathname, searchParams, { sort: e.target.value }))
      }
      className="h-11 rounded-xl border border-muted-300 bg-surface-0 px-4 text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
