import Link from "next/link";
import { X } from "lucide-react";
import { buildQueryUrl } from "@/lib/utils";

export interface ActiveFilter {
  key: string;
  label: string;
}

export function ActiveFiltersBar({
  basePath,
  params,
  filters,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  filters: ActiveFilter[];
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-500">Filters:</span>
      {filters.map((filter) => (
        <Link
          key={filter.key}
          href={buildQueryUrl(basePath, params, { [filter.key]: undefined })}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          {filter.label}
          <X className="h-3.5 w-3.5" />
        </Link>
      ))}
    </div>
  );
}
