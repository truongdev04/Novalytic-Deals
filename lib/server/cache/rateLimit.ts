import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

function createLimiter(tokens: number, window: Duration): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
  });
}

// Limits per CLAUDE.md "Auth & bảo mật": newsletter 5/min, vote 10/min,
// review 3/h, submit-coupon 3/day. Contact/search/reveal are not spec'd
// explicitly — reasonable defaults chosen to prevent abuse.
export const newsletterRateLimit = createLimiter(5, "1 m");
export const voteRateLimit = createLimiter(10, "1 m");
export const revealRateLimit = createLimiter(10, "1 m");
export const reviewRateLimit = createLimiter(3, "1 h");
export const submitCouponRateLimit = createLimiter(3, "1 d");
export const contactRateLimit = createLimiter(5, "1 h");
export const searchRateLimit = createLimiter(30, "1 m");

// upload: not spec'd in CLAUDE.md — default chosen to bound Cloudinary/Supabase
// quota burn from a runaway admin client, not to stop abuse (already auth-gated).
export const uploadRateLimit = createLimiter(20, "1 m");

export async function checkRateLimit(limiter: Ratelimit | null, identifier: string) {
  if (!limiter) {
    // Upstash not configured (e.g. local dev) — allow all requests through.
    return { success: true };
  }
  const result = await limiter.limit(identifier);
  return { success: result.success };
}
