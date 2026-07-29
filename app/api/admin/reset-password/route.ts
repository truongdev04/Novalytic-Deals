import type { NextRequest } from "next/server";
import { getUserByEmail, setUserPassword } from "@/lib/data";
import { resetPasswordSchema } from "@/lib/validators/admin/forgotPassword";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { verifyToken } from "@/lib/server/security/signedToken";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid request");

  const raw = verifyToken(parsed.data.resetToken);
  if (!raw) return jsonError(400, "Invalid or expired reset link.");

  const [email, expiresAtStr] = raw.split("|");
  if (!email || !expiresAtStr || Date.now() > Number(expiresAtStr)) {
    return jsonError(400, "This reset link has expired. Please request a new one.");
  }

  const user = await getUserByEmail(email);
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    return jsonError(400, "Invalid or expired reset link.");
  }

  await setUserPassword(user.id, parsed.data.password);
  return jsonOk({ reset: true });
}
