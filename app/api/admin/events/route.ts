import type { NextRequest } from "next/server";
import { createEvent, getEventById, getEvents, setEventCoupons, setEventStores } from "@/lib/data";
import { adminEventSchema } from "@/lib/validators/admin/event";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const events = await getEvents();
  return jsonOk(events);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminEventSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid event data");

  const event = await createEvent({
    slug: parsed.data.slug,
    name: parsed.data.name,
    iconName: parsed.data.iconName,
    description: parsed.data.description,
    bannerUrl: parsed.data.bannerUrl || null,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
  });

  await Promise.all([
    setEventStores(event.id, parsed.data.featuredStoreIds),
    setEventCoupons(event.id, parsed.data.featuredCouponIds),
  ]);

  const finalEvent = await getEventById(event.id);
  return jsonOk(finalEvent, 201);
}
