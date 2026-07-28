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
//
// The Resend SDK never throws on API-level failures (bad/unverified "from"
// domain, sandbox sender restrictions, etc) — it resolves { data: null,
// error } instead. Callers must check the returned `ok` flag; previously
// this was silently discarded, so a rejected send looked identical to a
// successful one (e.g. newsletter confirmations never arriving with zero
// visible error anywhere).
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean }> {
  const { apiKey, fromEmail } = await getEffectiveResendConfig();
  if (!apiKey) {
    console.log("[email:dev-fallback]", input.to, input.subject);
    return { ok: true };
  }
  const resend = new Resend(apiKey);
  const from = fromEmail ?? "NovalyticDeals <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) {
    console.error("[email:send-failed]", input.to, input.subject, error);
    return { ok: false };
  }
  return { ok: true };
}
