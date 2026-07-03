import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Resend is optional in dev — falls back to a console log so forms still
// work end-to-end locally before RESEND_API_KEY is configured.
export async function sendEmail(input: SendEmailInput) {
  if (!resend) {
    console.log("[email:dev-fallback]", input.to, input.subject);
    return;
  }
  const from = process.env.CONTACT_INBOX_EMAIL ?? "NovalyticDeals <onboarding@resend.dev>";
  await resend.emails.send({ from, to: input.to, subject: input.subject, html: input.html });
}
