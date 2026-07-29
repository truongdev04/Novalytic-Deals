import type { NextRequest } from "next/server";
import { getUserByEmail } from "@/lib/data";
import { forgotPasswordRequestSchema } from "@/lib/validators/admin/forgotPassword";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { forgotPasswordRateLimit } from "@/lib/server/cache/rateLimit";
import { verifyTurnstileToken } from "@/lib/server/security/turnstile";
import { redis } from "@/lib/server/cache/redis";
import { sendEmail } from "@/lib/server/email/resend";
import { adminPasswordResetCodeEmail } from "@/lib/server/email/templates";

const OTP_TTL_SECONDS = 600;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(forgotPasswordRateLimit, ip);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid email address");

  const verified = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!verified) return jsonError(400, "Verification failed. Please try again.");

  if (!redis) {
    // No DB fallback table exists for OTPs (deliberate — Redis-only design).
    return jsonError(503, "Password reset is temporarily unavailable. Please contact support.");
  }

  // Explicitly reveals whether the email is a registered admin account —
  // a deliberate product choice for this internal tool (overrides the
  // stricter anti-enumeration default used elsewhere in the app).
  const user = await getUserByEmail(parsed.data.email);
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    return jsonError(404, "This email is not a registered admin account.");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await redis.set(`admin-reset-otp:${parsed.data.email}`, code, { ex: OTP_TTL_SECONDS });
  const { subject, html } = adminPasswordResetCodeEmail(code);
  await sendEmail({ to: parsed.data.email, subject, html });

  return jsonOk({ sent: true });
}
