import type { NextRequest } from "next/server";
import { bulkAssignStoresToEvent, getEventOwnerId } from "@/lib/data";
import { adminEventBulkAssignSchema } from "@/lib/validators/admin/event";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { authorizeRecordAccess } from "@/lib/server/api/ownership";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminEventBulkAssignSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid request data");

  const authz = await authorizeRecordAccess(parsed.data.eventId, "events", getEventOwnerId);
  if ("error" in authz) return authz.error;

  try {
    const result = await bulkAssignStoresToEvent(parsed.data.eventId, parsed.data.count);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      return jsonError(404, "Event not found");
    }
    return jsonError(500, "Failed to add stores to event");
  }
}
