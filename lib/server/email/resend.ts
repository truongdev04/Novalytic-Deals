import { Resend } from "resend";
import { getEffectiveResendConfig } from "@/lib/data/settings";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Resend is optional in dev — falls back to a console log so forms still
// work end-to-end locally before RESEND_API_KEY is configured. The client
// is constructed per-call (not module-level) so an admin-saved DB key takes
// effect immediately, without a redeploy.
export async function sendEmail(input: SendEmailInput) {
  const { apiKey, fromEmail } = await getEffectiveResendConfig();
  if (!apiKey) {
    console.log("[email:dev-fallback]", input.to, input.subject);
    return;
  }
  const resend = new Resend(apiKey);
  const from = fromEmail ?? "NovalyticDeals <onboarding@resend.dev>";
  await resend.emails.send({ from, to: input.to, subject: input.subject, html: input.html });
}
