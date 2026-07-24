import { Link } from "next-view-transitions";
import { StoreLogo } from "@/components/store/StoreLogo";
import { DiscountBadge } from "@/components/coupon/DiscountBadge";
import { VerifiedBadge } from "@/components/coupon/VerifiedBadge";
import { CouponCodeModal } from "@/components/coupon/CouponCodeModal";
import type { Coupon, Store } from "@/types";

export function CouponGridCard({
  coupon,
  store,
  revealBreakpoint,
}: {
  coupon: Coupon;
  store: Store;
  revealBreakpoint?: "mobile" | "desktop";
}) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-muted-200 bg-surface-0 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/store/${store.slug}`}
        className="flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-surface-0 pt-3 px-1.5 pb-1"
      >
        <StoreLogo
          logoUrl={store.logoUrl}
          name={store.name}
          size="xl"
          className="rounded-full transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <DiscountBadge coupon={coupon} className="rounded-xl px-2 py-0.5 text-xs" />
          {coupon.verified && <VerifiedBadge className="px-2 py-0.5 text-xs" />}
        </div>

        <p className="mt-1.5 text-xs font-medium text-muted-700">{store.name}</p>

        <Link href={`/coupon/${coupon.slug}`} className="mt-1 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-brand-950 hover:text-brand-700">
            {coupon.title}
          </h3>
        </Link>

        <div className="mt-2.5">
          <CouponCodeModal
            coupon={coupon}
            store={store}
            size="md"
            className="w-full"
            newTabHref={`/store/${store.slug}`}
            revealBreakpoint={revealBreakpoint}
          />
        </div>
      </div>
    </div>
  );
}
