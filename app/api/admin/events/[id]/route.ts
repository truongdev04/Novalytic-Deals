import type { NextRequest } from "next/server";
import {
  deleteEvent,
  getEventById,
  setEventCoupons,
  setEventStores,
  updateEvent,
} from "@/lib/data";
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
    iconName: parsed.data.iconName,
    description: parsed.data.description,
    bannerUrl: parsed.data.bannerUrl || null,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
  });

  await Promise.all([
    setEventStores(id, parsed.data.featuredStoreIds),
    setEventCoupons(id, parsed.data.featuredCouponIds),
  ]);

  const event = await getEventById(id);
  return jsonOk(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteEvent(id);
  return jsonOk({ deleted: true });
}
