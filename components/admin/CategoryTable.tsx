"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import { renderCategoryIcon } from "@/lib/icons";
import type { Category } from "@/types";

const BOOL_FILTER_ALL = "all";

const selectClassName =
  "rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 focus:border-brand-400 focus:outline-none";

export function CategoryTable({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState(BOOL_FILTER_ALL);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((category) => {
      if (q) {
        const matchesQuery =
          category.name.toLowerCase().includes(q) || category.slug.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (featuredFilter !== BOOL_FILTER_ALL && String(category.isFeatured) !== featuredFilter) {
        return false;
      }

      return true;
    });
  }, [categories, query, featuredFilter]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <select
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          className={selectClassName}
        >
          <option value={BOOL_FILTER_ALL}>All featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((category) => (
              <tr key={category.id} className="border-t border-muted-200">
                <td className="px-4 py-3">
                  <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-muted-200 bg-brand-50 text-brand-600">
                    {renderCategoryIcon(category, { iconClassName: "h-4 w-4" })}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-brand-950">{category.name}</td>
                <td className="px-4 py-3 text-muted-600">{category.slug}</td>
                <td className="px-4 py-3">
                  <AdminDropdownSelect
                    endpoint={`/api/admin/categories/${category.id}`}
                    field="isFeatured"
                    value={category.isFeatured}
                    options={[
                      { value: true, label: "Featured" },
                      { value: false, label: "Not featured" },
                    ]}
                    triggerClassName="w-28"
                    badgeClassName={
                      category.isFeatured
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-muted-300 text-muted-500 hover:bg-surface-100"
                    }
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                  {new Date(category.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      aria-label={`Edit ${category.name}`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      endpoint={`/api/admin/categories/${category.id}`}
                      confirmLabel={category.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
