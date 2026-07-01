import Link from "next/link";
import { StoreLogo } from "@/components/store/StoreLogo";
import { DiscountBadge } from "@/components/coupon/DiscountBadge";
import { VerifiedBadge } from "@/components/coupon/VerifiedBadge";
import { ExpirationBadge } from "@/components/coupon/ExpirationBadge";
import { CouponCodeModal } from "@/components/coupon/CouponCodeModal";
import type { Coupon, Store } from "@/types";

export function CouponCard({ coupon, store }: { coupon: Coupon; store: Store }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-muted-200 bg-surface-0 p-5 shadow-sm transition-shadow duration-200 ease-out hover:shadow-md sm:flex-row sm:items-center">
      <StoreLogo logoUrl={store.logoUrl} name={store.name} size="md" />

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <DiscountBadge coupon={coupon} />
          {coupon.verified && <VerifiedBadge />}
          <ExpirationBadge expiresAt={coupon.expiresAt} />
        </div>
        <Link href={`/coupon/${coupon.slug}`} className="mt-2 block">
          <h3 className="font-heading font-semibold text-brand-950 hover:text-brand-700">
            {coupon.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-muted-600">{store.name}</p>
      </div>

      <CouponCodeModal coupon={coupon} store={store} />
    </div>
  );
}
