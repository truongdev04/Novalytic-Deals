import { getCouponsByStore, updateStoreSeoDiscountSnapshot } from "@/lib/data";
import { getUtcPeriodKey } from "@/lib/content/template";
import { isExpired } from "@/lib/utils";
import type { Coupon, Store } from "@/types";

// Only coupons with a real numeric discount can produce a "{discount}" value
// — OTHER/FREESHIP/BOGO/CASHBACK have nothing comparable to show as "20%"/"$50".
function isEligibleForDiscountLabel(coupon: Coupon): boolean {
  return (
    coupon.isActive &&
    !isExpired(coupon.expiresAt) &&
    (coupon.discountType === "PERCENT" || coupon.discountType === "AMOUNT")
  );
}

function pickHighestValue(coupons: Coupon[]): Coupon {
  return coupons.reduce((best, c) => (c.discountValue > best.discountValue ? c : best));
}

// Priority: exclusive (any type) > type=CODE (highest value) > type=DEAL
// (highest value). Mirrors the raw-number PERCENT-vs-AMOUNT comparison the
// existing `bestOffer` reducer on the store page already uses, for
// site-wide consistency.
function pickBestDiscountCoupon(coupons: Coupon[]): Coupon | undefined {
  const eligible = coupons.filter(isEligibleForDiscountLabel);
  const exclusive = eligible.filter((c) => c.exclusive);
  if (exclusive.length > 0) return pickHighestValue(exclusive);
  const codes = eligible.filter((c) => c.type === "CODE");
  if (codes.length > 0) return pickHighestValue(codes);
  const deals = eligible.filter((c) => c.type === "DEAL");
  if (deals.length > 0) return pickHighestValue(deals);
  return undefined;
}

// Deliberately not lib/utils.ts's formatDiscount() — that appends " OFF"/
// "DEAL", but the SEO title/description structure already supplies the
// word "Off" itself, so this needs just the bare value ("20%"/"$50").
function formatDiscountLabel(coupon: Coupon): string {
  return coupon.discountType === "PERCENT"
    ? `${coupon.discountValue}%`
    : `${coupon.currency}${coupon.discountValue}`;
}

// Returns the store's SEO discount label, frozen for the current UTC month.
// null means "no qualifying coupon this period" — callers should use the
// fallback title/description template instead. Recomputes and persists
// (lib/data/stores.ts's updateStoreSeoDiscountSnapshot) only when the
// store's stored period differs from the current one; otherwise returns the
// frozen value as-is, even if the store's live coupons have since changed —
// intentional, matches rule 4.1 ("only update once a month").
export async function resolveStoreDiscountLabel(store: Store): Promise<string | null> {
  const currentPeriod = getUtcPeriodKey(new Date());
  if (store.seoDiscountSnapshotPeriod === currentPeriod) {
    return store.seoDiscountSnapshot ?? null;
  }

  const coupons = await getCouponsByStore(store.id);
  const best = pickBestDiscountCoupon(coupons);
  const discountLabel = best ? formatDiscountLabel(best) : null;

  await updateStoreSeoDiscountSnapshot(store.id, { discountLabel, period: currentPeriod });

  return discountLabel;
}
