import { describe, expect, it } from "vitest";
import { newsletterSchema } from "./newsletter";

describe("newsletterSchema", () => {
  it("accepts a valid email", () => {
    expect(newsletterSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects an empty email", () => {
    expect(newsletterSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(newsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a missing email field", () => {
    expect(newsletterSchema.safeParse({}).success).toBe(false);
  });
});
