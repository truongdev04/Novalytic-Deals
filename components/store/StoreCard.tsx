import Link from "next/link";
import { StoreLogo } from "@/components/store/StoreLogo";
import { cn, stripHtml } from "@/lib/utils";
import type { Store } from "@/types";

export function StoreCard({
  store,
  couponCount,
  countLabel = "coupon",
  pluralizeLabel = true,
  compact = false,
}: {
  store: Store;
  couponCount: number;
  countLabel?: string;
  pluralizeLabel?: boolean;
  /** Smaller logo/padding, no description — used for dense index-style listings (e.g. stores/[letter]). */
  compact?: boolean;
}) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className={cn(
        "group flex flex-col items-center rounded-lg border border-muted-200 bg-surface-0 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
        compact ? "p-3" : "p-5"
      )}
    >
      <StoreLogo logoUrl={store.logoUrl} name={store.name} size={compact ? "sm" : "md"} />
      <h3
        className={cn(
          "w-full truncate font-heading font-semibold text-brand-950",
          compact ? "mt-2 text-sm" : "mt-3 text-base"
        )}
      >
        {store.name}
      </h3>
      {!compact && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-500">{stripHtml(store.description)}</p>
      )}
      <span
        className={cn(
          "font-semibold text-brand-600 group-hover:text-brand-700",
          compact ? "mt-1.5 text-xs" : "mt-3 text-xs"
        )}
      >
        {couponCount} {countLabel}
        {pluralizeLabel && couponCount !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}
