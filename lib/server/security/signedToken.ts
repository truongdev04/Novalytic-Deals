import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to sign tokens");
  return secret;
}

// Stateless signed token (no DB column needed) used for the newsletter
// double opt-in confirm/unsubscribe links.
export function signToken(value: string): string {
  const payload = Buffer.from(value, "utf8").toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return Buffer.from(payload, "base64url").toString("utf8");
}
