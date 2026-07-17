import { Globe } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { StoreRating } from "@/components/store/StoreRating";
import { Badge } from "@/components/ui/Badge";
import { RichHtml } from "@/components/ui/RichHtml";
import type { Store } from "@/types";

export function StoreHeader({
  store,
  totalCoupons,
  activeDeals,
  bestOfferLabel,
}: {
  store: Store;
  totalCoupons: number;
  activeDeals: number;
  bestOfferLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-muted-200 bg-surface-0 p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <StoreLogo logoUrl={store.logoUrl} name={store.name} size="lg" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950">{store.name}</h1>
        <RichHtml html={store.description} className="mt-1 text-sm text-muted-600" />
        <div className="mt-3">
          <StoreRating store={store} />
        </div>
        <a
          href={store.website}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <Globe className="h-4 w-4" />
          Visit website
        </a>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-muted-200 pt-5 text-center">
        <div>
          <dt className="text-xs text-muted-500">Total coupons</dt>
          <dd className="mt-1 font-heading text-xl font-semibold text-brand-950">
            {totalCoupons}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-500">Active deals</dt>
          <dd className="mt-1 font-heading text-xl font-semibold text-brand-950">
            {activeDeals}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-500">Best offer</dt>
          <dd className="mt-1">
            {bestOfferLabel ? (
              <Badge variant="accent">{bestOfferLabel}</Badge>
            ) : (
              <span className="text-sm text-muted-400">—</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
