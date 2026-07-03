import { type NextRequest, NextResponse } from "next/server";
import {
  getCouponById,
  getStoreById,
  incrementCouponUsage,
  logClickEvent,
} from "@/lib/data";
import { buildAffiliateRedirectUrl } from "@/lib/server/affiliate/redirect";

const SESSION_COOKIE = "nd_session";

// Never expose the affiliate URL in the DOM: this is the only place it is
// resolved server-side. Logs a ClickEvent + bumps usageCount, then 302s.
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

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? crypto.randomUUID();

  await Promise.all([
    logClickEvent({
      couponId: coupon.id,
      storeId: store.id,
      userAgent: request.headers.get("user-agent") ?? undefined,
      referer: request.headers.get("referer") ?? undefined,
      country: request.headers.get("x-vercel-ip-country") ?? undefined,
      sessionId,
    }),
    incrementCouponUsage(coupon.id),
  ]);

  const redirectUrl = buildAffiliateRedirectUrl(coupon, store);
  const response = NextResponse.redirect(redirectUrl, 302);
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
