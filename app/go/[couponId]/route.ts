import { type NextRequest, NextResponse } from "next/server";
import {
  getCouponById,
  getStoreById,
  incrementCouponUsage,
  incrementStoreClickCount,
} from "@/lib/data";
import { buildAffiliateRedirectUrl } from "@/lib/server/affiliate/redirect";

// Never expose the affiliate URL in the DOM: this is the only place it is
// resolved server-side. Bumps usageCount/clickCount, then 302s.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const { couponId } = await params;

  const coupon = await getCouponById(couponId);
  if (!coupon) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const store = await getStoreById(coupon.storeId);
  if (!store) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await Promise.all([incrementCouponUsage(coupon.id), incrementStoreClickCount(store.id)]);

  const redirectUrl = buildAffiliateRedirectUrl(coupon, store);
  return NextResponse.redirect(redirectUrl, 302);
}
