import { test, expect } from "@playwright/test";

// Exercises the reveal -> /go redirect chain at the API level. This does bump
// real usage/click counters on whichever coupon /api/coupons returns first —
// an acceptable, low-risk side effect (equivalent to one real page visit),
// unlike the newsletter/submit-coupon/review flows which would create junk
// rows and are intentionally left as UI-only validation checks elsewhere.
test("revealing a coupon returns a code and a working /go redirect", async ({ request }) => {
  const couponsRes = await request.get("/api/coupons");
  const coupons = (await couponsRes.json()).data as { id: string }[];
  test.skip(!coupons?.length, "no coupons in the database to test against");
  const couponId = coupons[0].id;

  const revealRes = await request.post(`/api/coupons/${couponId}/reveal`);
  expect(revealRes.ok()).toBe(true);
  const revealBody = await revealRes.json();
  expect(revealBody.data.goUrl).toBe(`/go/${couponId}`);

  const goRes = await request.get(`/go/${couponId}`, { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(goRes.status());
  const location = goRes.headers()["location"];
  expect(location).toBeTruthy();
  expect(location?.startsWith("/")).toBe(false); // resolves off-site, never back into the app
});
