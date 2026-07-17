import Link from "next/link";
import { StoreLogo } from "@/components/store/StoreLogo";
import { stripHtml } from "@/lib/utils";
import type { Store } from "@/types";

export function StoreCard({
  store,
  couponCount,
  countLabel = "coupon",
  pluralizeLabel = true,
}: {
  store: Store;
  couponCount: number;
  countLabel?: string;
  pluralizeLabel?: boolean;
}) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className="group flex flex-col items-center rounded-lg border border-muted-200 bg-surface-0 p-5 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <StoreLogo logoUrl={store.logoUrl} name={store.name} size="md" />
      <h3 className="mt-3 font-heading text-base font-semibold text-brand-950">{store.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-500">{stripHtml(store.description)}</p>
      <span className="mt-3 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        {couponCount} {countLabel}
        {pluralizeLabel && couponCount !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}
