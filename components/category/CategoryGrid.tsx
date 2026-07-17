"use client";

import { useState } from "react";
import { CategoryCard } from "@/components/category/CategoryCard";
import type { Category } from "@/types";

const COLUMNS_AT_DESKTOP = 4;
const ROWS_PER_PAGE = 4;
const PAGE_SIZE = COLUMNS_AT_DESKTOP * ROWS_PER_PAGE;

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleCategories = categories.slice(0, visibleCount);
  const hasMore = visibleCount < categories.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {visibleCategories.map((category) => (
          <CategoryCard key={category.id} category={category} showCount={false} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-xl border border-muted-300 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface-100"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
