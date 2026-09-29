"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import { renderCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const SCROLL_STORAGE_KEY = "admin-categories-scroll-y";
const LAST_EDITED_CATEGORY_KEY = "admin-categories-last-id";

const BOOL_FILTER_ALL = "all";

const featuredFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All featured" },
  { value: "true", label: "Featured" },
  { value: "false", label: "Not featured" },
];

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
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const shouldScrollTop = sessionStorage.getItem("admin-categories-scroll-top");
    if (shouldScrollTop) {
      sessionStorage.removeItem("admin-categories-scroll-top");
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      sessionStorage.removeItem(LAST_EDITED_CATEGORY_KEY);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    const savedY = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    const lastId = sessionStorage.getItem(LAST_EDITED_CATEGORY_KEY);
    if (!savedY && !lastId) return;

    const restore = () => {
      if (lastId) {
        const itemIndex = filtered.findIndex((c) => c.id === lastId);
        if (itemIndex !== -1) {
          const targetPage = Math.floor(itemIndex / pageSize) + 1;
          if (targetPage !== page) {
            setPage(targetPage);
          }
        }
        const row = document.getElementById(`category-row-${lastId}`);
        if (row) {
          row.scrollIntoView({ block: "center", behavior: "instant" });
          setHighlightedCategoryId(lastId);
          setTimeout(() => setHighlightedCategoryId(null), 2500);
          sessionStorage.removeItem(SCROLL_STORAGE_KEY);
          sessionStorage.removeItem(LAST_EDITED_CATEGORY_KEY);
          return true;
        }
      }
      if (savedY) {
        window.scrollTo({ top: Number(savedY), behavior: "instant" });
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
        sessionStorage.removeItem(LAST_EDITED_CATEGORY_KEY);
        return true;
      }
      return false;
    };

    if (!restore()) {
      const raf = requestAnimationFrame(() => {
        if (!restore()) {
          const timer = setTimeout(restore, 100);
          return () => clearTimeout(timer);
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [categories, paged, filtered, pageSize, page, setPage]);

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

        <div className="w-36">
          <SingleSelectDropdown
            options={featuredFilterOptions}
            value={featuredFilter}
            onChange={setFeaturedFilter}
            placeholder="All featured"
          />
        </div>
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
              <tr
                key={category.id}
                id={`category-row-${category.id}`}
                className={cn(
                  "border-t border-muted-200 transition-colors duration-1000",
                  highlightedCategoryId === category.id && "bg-brand-50"
                )}
              >
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
                  {new Date(category.createdAt).toLocaleDateString("en-US")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      prefetch={false}
                      onClick={() => {
                        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
                        sessionStorage.setItem(LAST_EDITED_CATEGORY_KEY, category.id);
                      }}
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
