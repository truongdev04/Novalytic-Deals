import type { NextRequest } from "next/server";
import { forgotPasswordVerifySchema } from "@/lib/validators/admin/forgotPassword";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { forgotPasswordVerifyRateLimit } from "@/lib/server/cache/rateLimit";
import { redis } from "@/lib/server/cache/redis";
import { signToken } from "@/lib/server/security/signedToken";

const OTP_ATTEMPT_TTL_SECONDS = 600;
const MAX_ATTEMPTS = 5;
const RESET_TICKET_TTL_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(forgotPasswordVerifyRateLimit, ip);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordVerifySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid request");

  if (!redis) {
    return jsonError(503, "Password reset is temporarily unavailable. Please contact support.");
  }

  const { email, code } = parsed.data;

  // Per-email attempt limit — independent of per-IP rate limiting, since a
  // 6-digit code (1e6 space) is brute-forceable across rotating IPs otherwise.
  const attemptsKey = `admin-reset-otp-attempts:${email}`;
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) await redis.expire(attemptsKey, OTP_ATTEMPT_TTL_SECONDS);
  if (attempts > MAX_ATTEMPTS) {
    return jsonError(429, "Too many attempts. Please request a new code.");
  }

  const otpKey = `admin-reset-otp:${email}`;
  // Upstash's REST client JSON-parses stored values, so a numeric-looking
  // string like "048213" round-trips as the number 48213 — compare as
  // strings to avoid every real code silently failing this check.
  const stored = await redis.get<string | number>(otpKey);
  if (stored === null || stored === undefined || String(stored) !== code) {
    return jsonError(400, "Invalid or expired code.");
  }

  await redis.del(otpKey);

  const payload = `${email}|${Date.now() + RESET_TICKET_TTL_MS}`;
  const resetToken = signToken(payload);
  return jsonOk({ resetToken });
}
