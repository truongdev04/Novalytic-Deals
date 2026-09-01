import { StoreLogo } from "@/components/store/StoreLogo";
import { VerifiedBadge } from "@/components/coupon/VerifiedBadge";
import { CouponCodeModal } from "@/components/coupon/CouponCodeModal";
import { formatDiscount } from "@/lib/utils";
import type { Coupon, Store } from "@/types";

// formatDiscount() always returns either "{value} OFF" (PERCENT/AMOUNT),
// "FREE SHIPPING", or "DEAL" — splitting on the first space gives a clean
// big-number-over-label pair for every case without extra per-type logic.
function splitDiscountLabel(label: string): [string, string] {
  const spaceIndex = label.indexOf(" ");
  if (spaceIndex === -1) return [label, ""];
  return [label.slice(0, spaceIndex), label.slice(spaceIndex + 1)];
}

export function StoreCouponCard({
  coupon,
  store,
  isTopPick = false,
}: {
  coupon: Coupon;
  store: Store;
  isTopPick?: boolean;
}) {
  const [discountValue, discountLabel] = splitDiscountLabel(
    formatDiscount(coupon.type, coupon.discountType, coupon.discountValue, coupon.currency)
  );

  return (
    <div className="relative h-full">
      {isTopPick && (
        <span className="absolute -top-3 left-4 z-10 rounded-md bg-brand-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          Top pick
        </span>
      )}

      {/* Below sm, the horizontal layout has no room for the discount
          column + title + button side by side — stack it vertically:
          logo + discount on one row, verified under it, then title, then
          a full-width action button. */}
      <div className="flex h-full flex-col rounded-lg border border-muted-200 bg-surface-0 p-4 shadow-sm sm:hidden">
        <div className="flex items-start gap-3">
          <StoreLogo logoUrl={store.logoUrl} name={store.name} size="md" />
          <div className="min-w-0">
            <p className="font-heading text-3xl font-extrabold leading-none text-accent-600">
              {discountValue}
              {discountLabel && (
                <span className="ml-1 text-xl font-bold uppercase">{discountLabel}</span>
              )}
            </p>
            {coupon.verified && (
              <div className="mt-2">
                <VerifiedBadge className="px-1.5 py-0.5 text-xs" />
              </div>
            )}
          </div>
        </div>

        <h3 className="mt-4 line-clamp-2 font-heading text-base font-semibold text-brand-950">
          {coupon.title}
        </h3>

        <CouponCodeModal
          coupon={coupon}
          store={store}
          className="mt-4 w-full"
          revealBreakpoint="mobile"
        />
      </div>

      <div className="hidden rounded-lg border border-muted-200 bg-surface-0 p-5 shadow-sm transition-shadow duration-200 ease-out hover:shadow-md sm:flex sm:items-center sm:gap-4">
        <div className="flex shrink-0 flex-col items-center justify-center px-2 text-center sm:border-r sm:border-muted-200 sm:pr-5">
          <span className="font-heading text-2xl font-bold text-accent-600 sm:text-3xl">
            {discountValue}
          </span>
          {discountLabel && (
            <span className="text-xs font-bold uppercase text-accent-600">{discountLabel}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <StoreLogo logoUrl={store.logoUrl} name={store.name} size="xs" />
            <span className="text-xs font-medium text-muted-500">{store.name}</span>
          </div>

          <h3 className="mt-1.5 line-clamp-2 font-heading text-lg font-semibold text-brand-950 sm:text-xl">
            {coupon.title}
          </h3>

          {coupon.verified && (
            <div className="mt-2">
              <VerifiedBadge className="px-1.5 py-0.5 text-xs" />
            </div>
          )}
        </div>

        <CouponCodeModal
          coupon={coupon}
          store={store}
          className="w-full sm:w-40"
          revealBreakpoint="desktop"
        />
      </div>
    </div>
  );
}
