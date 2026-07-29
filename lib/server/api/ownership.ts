import type { Session } from "next-auth";
import { auth } from "@/auth";
import { isDataScoped } from "@/lib/permissions";
import type { DataScopedPermission } from "@/lib/validators/admin/user";
import { jsonError } from "@/lib/server/api/response";

/**
 * Shared [id]/route.ts guard for the 6 data-scoped modules (stores, coupons,
 * deals, categories, events, blog). Call at the top of GET/PATCH/DELETE,
 * before any existing logic (including business-rule checks like
 * CATEGORY_IN_USE) — an unauthorized editor should never learn anything
 * about a record's state.
 *
 * - No session → 401.
 * - Session is a non-data-scoped role/editor (ADMIN, or an editor with full
 *   data access to this module) → passes through untouched.
 * - Scoped editor who doesn't own the record → 403 (404 if it doesn't exist
 *   at all, so a scoped editor can't distinguish "not yours" from "missing").
 */
export async function authorizeRecordAccess(
  id: string,
  module: DataScopedPermission,
  getOwnerId: (id: string) => Promise<string | null | undefined>
): Promise<{ session: Session } | { error: Response }> {
  const session = await auth();
  if (!session?.user?.id) return { error: jsonError(401, "Unauthorized") };

  if (isDataScoped(session.user.role, session.user.fullDataAccess, module)) {
    const ownerId = await getOwnerId(id);
    if (!ownerId) return { error: jsonError(404, "Not found") };
    if (ownerId !== session.user.id) {
      return { error: jsonError(403, "You don't have access to this record.") };
    }
  }

  return { session };
}
