import { Link } from "next-view-transitions";
import { renderCategoryIcon } from "@/lib/icons";
import type { Category } from "@/types";

export function CategoryCard({
  category,
  couponCount = 0,
  showCount = true,
}: {
  category: Category;
  couponCount?: number;
  showCount?: boolean;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center rounded-lg border border-muted-200 bg-surface-0 p-5 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
        {renderCategoryIcon(category, { iconClassName: "h-5 w-5" })}
      </span>
      <h3 className="mt-3 font-heading text-base font-semibold text-brand-950">
        {category.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-500">{category.description}</p>
      {showCount && (
        <span className="mt-3 text-xs font-semibold text-brand-600">
          {couponCount} {couponCount === 1 ? "coupon" : "coupons"}
        </span>
      )}
    </Link>
  );
}
