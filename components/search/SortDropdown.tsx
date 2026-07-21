"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildQueryUrl } from "@/lib/utils";
import { Dropdown } from "@/components/search/Dropdown";

const options = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "discount", label: "Highest Discount" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Dropdown
      ariaLabel="Sort results"
      options={options}
      value={searchParams.get("sort") ?? "relevance"}
      onChange={(value) => router.push(buildQueryUrl(pathname, searchParams, { sort: value }))}
      className="w-48"
    />
  );
}
