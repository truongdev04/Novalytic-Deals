import type { NextRequest } from "next/server";
import { upsertNewsletterSubscriber } from "@/lib/data";
import { newsletterSchema } from "@/lib/validators/newsletter";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { newsletterRateLimit } from "@/lib/server/cache/rateLimit";
import { verifyTurnstileToken } from "@/lib/server/security/turnstile";
import { isHoneypotTripped } from "@/lib/server/security/honeypot";
import { signToken } from "@/lib/server/security/signedToken";
import { sendEmail } from "@/lib/server/email/resend";
import { newsletterConfirmEmail } from "@/lib/server/email/templates";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(newsletterRateLimit, ip);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid email address");

  if (isHoneypotTripped(parsed.data.honeypot)) {
    // Pretend success so bots don't learn they were caught.
    return jsonOk({ subscribed: true });
  }

  const verified = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!verified) return jsonError(400, "Verification failed. Please try again.");

  await upsertNewsletterSubscriber(parsed.data.email, "website");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const token = signToken(parsed.data.email);
  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${token}`;
  const { subject, html } = newsletterConfirmEmail(confirmUrl);
  await sendEmail({ to: parsed.data.email, subject, html });

  return jsonOk({ subscribed: true });
}
