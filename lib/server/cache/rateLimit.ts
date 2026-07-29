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

// deal click: not spec'd in CLAUDE.md — generous enough for legitimate
// multi-deal browsing, bounds abuse of the public click-counter ping.
export const dealClickRateLimit = createLimiter(20, "1 m");

// forgot-password: public route that sends email — bound spam/enumeration
// probing, in the same order of magnitude as the contact form's 5/h.
export const forgotPasswordRateLimit = createLimiter(5, "1 h");

// forgot-password OTP verify: request-flooding is bounded by IP here; a
// separate per-email attempt counter (stored directly in Redis, see the
// verify route) stops brute-forcing one victim's 6-digit code across IPs.
export const forgotPasswordVerifyRateLimit = createLimiter(5, "1 m");

export async function checkRateLimit(limiter: Ratelimit | null, identifier: string) {
  if (!limiter) {
    // Upstash not configured (e.g. local dev) — allow all requests through.
    return { success: true };
  }
  const result = await limiter.limit(identifier);
  return { success: result.success };
}
