import type { Coupon, Store } from "@/types";

// v1: passthrough redirect to the stored affiliateUrl. Kept as its own
// function so network-specific subid/click-id templating can be added per
// store.affiliateNetwork later without touching the /go/[couponId] route.
export function buildAffiliateRedirectUrl(coupon: Coupon, _store: Store): string {
  return coupon.affiliateUrl;
}
