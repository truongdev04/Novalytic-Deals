import Image from "next/image";
import Link from "next/link";
import { DiscountBadge } from "@/components/coupon/DiscountBadge";
import { CouponCodeModal } from "@/components/coupon/CouponCodeModal";
import type { Coupon, Store } from "@/types";

export function DealCard({ coupon, store }: { coupon: Coupon; store: Store }) {
  return (
    <div className="group overflow-hidden rounded-lg border border-muted-200 bg-surface-0 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/coupon/${coupon.slug}`} className="relative block aspect-video w-full overflow-hidden">
        <Image
          src={store.bannerUrl ?? store.logoUrl}
          alt={coupon.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
        <span className="absolute right-3 top-3">
          <DiscountBadge coupon={coupon} />
        </span>
      </Link>

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {store.name}
        </p>
        <Link href={`/coupon/${coupon.slug}`}>
          <h3 className="mt-1 font-heading font-semibold text-brand-950 hover:text-brand-700">
            {coupon.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-600">{coupon.description}</p>
        <div className="mt-4">
          <CouponCodeModal coupon={coupon} store={store} size="sm" />
        </div>
      </div>
    </div>
  );
}
