import { describe, expect, it } from "vitest";
import { reviewSchema } from "./review";

const validInput = {
  authorName: "Jane Doe",
  rating: 5,
  body: "Fast shipping and great customer service overall.",
};

describe("reviewSchema", () => {
  it("accepts a valid review", () => {
    const result = reviewSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects rating below 1", () => {
    const result = reviewSchema.safeParse({ ...validInput, rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = reviewSchema.safeParse({ ...validInput, rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer rating", () => {
    const result = reviewSchema.safeParse({ ...validInput, rating: 4.5 });
    expect(result.success).toBe(false);
  });

  it("rejects a body shorter than 25 characters when entered", () => {
    const result = reviewSchema.safeParse({ ...validInput, body: "too short" });
    expect(result.success).toBe(false);
  });

  it("allows author name to be omitted (anonymous)", () => {
    const { authorName: _authorName, ...withoutName } = validInput;
    const result = reviewSchema.safeParse(withoutName);
    expect(result.success).toBe(true);
  });

  it("allows body to be omitted", () => {
    const { body: _body, ...withoutBody } = validInput;
    const result = reviewSchema.safeParse(withoutBody);
    expect(result.success).toBe(true);
  });

  it("allows honeypot and turnstileToken to be omitted", () => {
    const result = reviewSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});
