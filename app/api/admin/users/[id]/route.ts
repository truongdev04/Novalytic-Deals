import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { deleteUser, setUserPassword, updateUserRole } from "@/lib/data";
import { adminResetPasswordSchema, adminUpdateUserRoleSchema } from "@/lib/validators/admin/user";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const roleUpdate = adminUpdateUserRoleSchema.safeParse(body);
  if (roleUpdate.success) {
    try {
      const user = await updateUserRole(id, roleUpdate.data.role);
      return jsonOk(user);
    } catch (error) {
      if (error instanceof Error && error.message === "LAST_ADMIN") {
        return jsonError(400, "At least one admin must remain.");
      }
      return jsonError(500, "Failed to update role");
    }
  }

  const passwordReset = adminResetPasswordSchema.safeParse(body);
  if (passwordReset.success) {
    await setUserPassword(id, passwordReset.data.password);
    return jsonOk({ updated: true });
  }

  return jsonError(400, "Invalid user data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "Unauthorized");

  try {
    await deleteUser(id, session.user.id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "CANNOT_DELETE_SELF") {
      return jsonError(400, "You can't delete your own account.");
    }
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return jsonError(400, "At least one admin must remain.");
    }
    return jsonError(500, "Failed to delete user");
  }
}
