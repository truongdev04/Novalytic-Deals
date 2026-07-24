import { describe, expect, it } from "vitest";
import { buildAffiliateRedirectUrl } from "./redirect";
import type { Coupon, Store } from "@/types";

describe("buildAffiliateRedirectUrl", () => {
  it("returns the coupon's stored affiliateUrl unchanged", () => {
    const coupon = { affiliateUrl: "https://merchant.example/aff?ref=abc123" } as Coupon;
    const store = {} as Store;
    expect(buildAffiliateRedirectUrl(coupon, store)).toBe(
      "https://merchant.example/aff?ref=abc123"
    );
  });
});
