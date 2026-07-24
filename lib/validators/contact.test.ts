import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

const validInput = {
  name: "Jane Doe",
  email: "jane@example.com",
  message: "I have a question about a coupon that isn't working.",
};

describe("contactSchema", () => {
  it("accepts a valid submission", () => {
    expect(contactSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(contactSchema.safeParse({ ...validInput, name: "J" }).success).toBe(false);
  });

  it("rejects a message shorter than 10 characters", () => {
    expect(contactSchema.safeParse({ ...validInput, message: "short" }).success).toBe(false);
  });

  it("rejects a message longer than 2000 characters", () => {
    const result = contactSchema.safeParse({ ...validInput, message: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(contactSchema.safeParse({ ...validInput, email: "not-an-email" }).success).toBe(false);
  });
});
