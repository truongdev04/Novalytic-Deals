import type { NextRequest } from "next/server";
import { createSubmittedCoupon } from "@/lib/data";
import { submitCouponSchema } from "@/lib/validators/submitCoupon";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { submitCouponRateLimit } from "@/lib/server/cache/rateLimit";
import { verifyTurnstileToken } from "@/lib/server/security/turnstile";
import { isHoneypotTripped } from "@/lib/server/security/honeypot";
import { sendEmail } from "@/lib/server/email/resend";
import { submitCouponNotificationEmail } from "@/lib/server/email/templates";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(submitCouponRateLimit, ip);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = submitCouponSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid form submission");

  if (isHoneypotTripped(parsed.data.honeypot)) {
    return jsonOk({ submitted: true });
  }

  const verified = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!verified) return jsonError(400, "Verification failed. Please try again.");

  await createSubmittedCoupon({
    storeName: parsed.data.storeName,
    code: parsed.data.code,
    description: parsed.data.description,
    expiresAt: parsed.data.expiresAt,
    submitterEmail: parsed.data.submitterEmail,
  });

  const inbox = process.env.CONTACT_INBOX_EMAIL;
  if (inbox) {
    const { subject, html } = submitCouponNotificationEmail(
      parsed.data.storeName,
      parsed.data.description
    );
    await sendEmail({ to: inbox, subject, html });
  }

  return jsonOk({ submitted: true });
}
