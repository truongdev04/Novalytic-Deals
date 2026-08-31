import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getEventsAdmin, getEventOwnerId, randomizeEventCuratedCoupons } from "@/lib/data";
import { isDataScoped } from "@/lib/permissions";
import { adminEventRandomizeCouponsSchema } from "@/lib/validators/admin/event";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { authorizeRecordAccess } from "@/lib/server/api/ownership";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminEventRandomizeCouponsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid request data");

  const { eventId } = parsed.data;

  let eventIds: string[];
  if (eventId === "all") {
    const session = await auth();
    if (!session?.user?.id) return jsonError(401, "Unauthorized");
    const scoped = isDataScoped(session.user.role, session.user.fullDataAccess, "events");
    const events = await getEventsAdmin({
      createdById: scoped ? session.user.id : undefined,
    });
    eventIds = events.map((event) => event.id);
  } else {
    const authz = await authorizeRecordAccess(eventId, "events", getEventOwnerId);
    if ("error" in authz) return authz.error;
    eventIds = [eventId];
  }

  try {
    const result = await randomizeEventCuratedCoupons(eventIds);
    return jsonOk(result);
  } catch {
    return jsonError(500, "Failed to randomize curated coupons");
  }
}
