import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rateLimit";

describe("checkRateLimit", () => {
  it("allows all requests through when Redis is not configured (limiter is null)", async () => {
    const result = await checkRateLimit(null, "127.0.0.1");
    expect(result.success).toBe(true);
  });
});
