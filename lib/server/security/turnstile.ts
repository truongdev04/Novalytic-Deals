import { getEffectiveTurnstileConfig } from "@/lib/data/settings";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// TURNSTILE_SECRET_KEY is optional in dev — when unset, verification is
// skipped so forms remain testable before a Cloudflare account is wired up.
// The DB-stored key (if any) takes precedence over the env var.
export async function verifyTurnstileToken(token: string | undefined, ip: string) {
  const { secretKey: secret } = await getEffectiveTurnstileConfig();
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}
