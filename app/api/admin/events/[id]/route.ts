import type { NextRequest } from "next/server";
import { deleteEvent, getEventById, setEventCoupons, updateEvent } from "@/lib/data";
import { adminEventSchema } from "@/lib/validators/admin/event";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return jsonError(404, "Event not found");
  return jsonOk(event);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminEventSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid event data");

  await updateEvent(id, {
    slug: parsed.data.slug,
    name: parsed.data.name,
    iconName: parsed.data.iconName || undefined,
    iconImageUrl: parsed.data.iconImageUrl || null,
    description: parsed.data.description,
    bannerUrl: parsed.data.bannerUrl || null,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
  });

  await setEventCoupons(id, parsed.data.featuredCouponIds);

  const event = await getEventById(id);
  return jsonOk(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteEvent(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_IN_USE") {
      return jsonError(
        409,
        "Cannot delete this event because it still has stores assigned to it. Remove them first."
      );
    }
    return jsonError(500, "Failed to delete event");
  }
}
