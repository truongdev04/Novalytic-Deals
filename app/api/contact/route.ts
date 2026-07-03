import type { NextRequest } from "next/server";
import { contactSchema } from "@/lib/validators/contact";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { contactRateLimit } from "@/lib/server/cache/rateLimit";
import { verifyTurnstileToken } from "@/lib/server/security/turnstile";
import { isHoneypotTripped } from "@/lib/server/security/honeypot";
import { sendEmail } from "@/lib/server/email/resend";
import { contactNotificationEmail } from "@/lib/server/email/templates";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(contactRateLimit, ip);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid form submission");

  if (isHoneypotTripped(parsed.data.honeypot)) {
    return jsonOk({ sent: true });
  }

  const verified = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!verified) return jsonError(400, "Verification failed. Please try again.");

  const inbox = process.env.CONTACT_INBOX_EMAIL;
  if (inbox) {
    const { subject, html } = contactNotificationEmail(
      parsed.data.name,
      parsed.data.email,
      parsed.data.message
    );
    await sendEmail({ to: inbox, subject, html });
  }

  return jsonOk({ sent: true });
}
