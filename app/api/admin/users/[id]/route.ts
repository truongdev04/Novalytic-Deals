import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  deleteUser,
  setUserPassword,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from "@/lib/data";
import {
  adminResetPasswordSchema,
  adminUpdateUserRoleSchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
} from "@/lib/validators/admin/user";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Checked most-specific-shape-first: a full profile edit also contains a
  // `role` field, so it must be tried before the role-only patch below or
  // it would match that narrower schema and silently drop the other fields.
  const fullEdit = adminUpdateUserSchema.safeParse(body);
  if (fullEdit.success) {
    try {
      const user = await updateUser(id, fullEdit.data);
      return jsonOk(user);
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_TAKEN") {
        return jsonError(409, "This email is already in use.");
      }
      if (error instanceof Error && error.message === "LAST_ADMIN") {
        return jsonError(400, "At least one admin must remain.");
      }
      return jsonError(500, "Failed to update user");
    }
  }

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

  const statusUpdate = adminUpdateUserStatusSchema.safeParse(body);
  if (statusUpdate.success) {
    const session = await auth();
    if (!session?.user?.id) return jsonError(401, "Unauthorized");

    try {
      const user = await updateUserStatus(id, statusUpdate.data.status, session.user.id);
      return jsonOk(user);
    } catch (error) {
      if (error instanceof Error && error.message === "CANNOT_DEACTIVATE_SELF") {
        return jsonError(400, "You can't deactivate your own account.");
      }
      if (error instanceof Error && error.message === "LAST_ADMIN") {
        return jsonError(400, "At least one admin must remain.");
      }
      return jsonError(500, "Failed to update status");
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
