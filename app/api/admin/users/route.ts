import type { NextRequest } from "next/server";
import { createUser, getAllUsers } from "@/lib/data";
import { adminCreateUserSchema } from "@/lib/validators/admin/user";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const users = await getAllUsers();
  return jsonOk(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminCreateUserSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid user data");

  try {
    const user = await createUser(parsed.data);
    return jsonOk(user, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return jsonError(409, "This email is already in use.");
    }
    return jsonError(500, "Failed to create user");
  }
}
