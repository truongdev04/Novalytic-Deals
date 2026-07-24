import { describe, expect, it } from "vitest";
import { voteSchema } from "./vote";

describe("voteSchema", () => {
  it("accepts 'up'", () => {
    expect(voteSchema.safeParse({ direction: "up" }).success).toBe(true);
  });

  it("accepts 'down'", () => {
    expect(voteSchema.safeParse({ direction: "down" }).success).toBe(true);
  });

  it("rejects any other value", () => {
    expect(voteSchema.safeParse({ direction: "sideways" }).success).toBe(false);
  });

  it("rejects a missing direction", () => {
    expect(voteSchema.safeParse({}).success).toBe(false);
  });
});
