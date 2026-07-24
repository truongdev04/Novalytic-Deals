import { describe, expect, it } from "vitest";
import { submitCouponSchema } from "./submitCoupon";

const validInput = {
  storeName: "Amazon",
  websiteUrl: "https://www.amazon.com",
  code: "SAVE20",
  discountUnit: "%" as const,
  discountValue: 20,
  description: "20% off site-wide for new customers.",
  submitterEmail: "shopper@example.com",
};

describe("submitCouponSchema", () => {
  it("accepts a valid submission", () => {
    expect(submitCouponSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects an invalid website URL", () => {
    const result = submitCouponSchema.safeParse({ ...validInput, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive discount value", () => {
    const result = submitCouponSchema.safeParse({ ...validInput, discountValue: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported discount unit", () => {
    const result = submitCouponSchema.safeParse({ ...validInput, discountUnit: "GBP" });
    expect(result.success).toBe(false);
  });

  it("rejects a description shorter than 10 characters", () => {
    const result = submitCouponSchema.safeParse({ ...validInput, description: "too short" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid submitter email", () => {
    const result = submitCouponSchema.safeParse({ ...validInput, submitterEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("allows an empty coupon code (deals with no code)", () => {
    const result = submitCouponSchema.safeParse({ ...validInput, code: "" });
    expect(result.success).toBe(true);
  });
});
