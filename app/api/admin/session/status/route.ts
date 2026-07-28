import { auth } from "@/auth";
import { getUserActiveStatus } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

// Polled by AccountStatusWatcher to detect the current session's own
// account being deactivated or deleted mid-session (JWT sessions don't
// re-check the DB on every request, so this closes that gap client-side).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "Unauthorized");

  const active = await getUserActiveStatus(session.user.id);
  return jsonOk({ active });
}
