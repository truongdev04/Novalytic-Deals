import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma } from "@/lib/server/db";
import type { Event } from "@/types";
import type { Event as PrismaEvent } from "@prisma/client";

function toEvent(row: PrismaEvent, storeIds: string[]): Event {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    iconName: row.iconName || undefined,
    iconImageUrl: row.iconImageUrl ?? undefined,
    description: row.description,
    bannerUrl: row.bannerUrl ?? undefined,
    startsAt: row.startsAt?.toISOString(),
    endsAt: row.endsAt?.toISOString(),
    featuredStoreIds: storeIds,
    featuredCouponIds: row.couponId,
    createdAt: row.createdAt.toISOString(),
  };
}

// One batched query for all events' store links, grouped in JS — avoids an
// N+1 when listing every event.
async function storeIdsByEventId(eventIds: string[]): Promise<Map<string, string[]>> {
  const stores = await prisma.store.findMany({
    where: { eventId: { in: eventIds } },
    select: { id: true, eventId: true },
  });
  const map = new Map<string, string[]>();
  for (const s of stores) {
    if (!s.eventId) continue;
    const list = map.get(s.eventId) ?? [];
    list.push(s.id);
    map.set(s.eventId, list);
  }
  return map;
}

export const getEvents = unstable_cache(
  async (): Promise<Event[]> => {
    const rows = await prisma.event.findMany();
    const byEvent = await storeIdsByEventId(rows.map((r) => r.id));
    return rows
      .map((row) => toEvent(row, byEvent.get(row.id) ?? []))
      .sort(
        (a, b) =>
          new Date(a.startsAt ?? "9999-12-31").getTime() -
          new Date(b.startsAt ?? "9999-12-31").getTime()
      );
  },
  ["events:list"],
  { tags: ["events:list"], revalidate: 300 }
);

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.event.findUnique({ where: { slug } });
      if (!row) return undefined;
      const stores = await prisma.store.findMany({ where: { eventId: row.id }, select: { id: true } });
      return toEvent(row, stores.map((s) => s.id));
    },
    [`event:${slug}`],
    { tags: [`event:${slug}`], revalidate: 300 }
  )();
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const row = await prisma.event.findUnique({ where: { id } });
  if (!row) return undefined;
  const stores = await prisma.store.findMany({ where: { eventId: id }, select: { id: true } });
  return toEvent(row, stores.map((s) => s.id));
}

export async function deleteEvent(id: string): Promise<void> {
  const storeCount = await prisma.store.count({ where: { eventId: id } });
  if (storeCount > 0) {
    throw new Error("EVENT_IN_USE");
  }

  const row = await prisma.event.delete({ where: { id } });
  purgeTag("events:list");
  purgeTag(`event:${row.slug}`);
}

export interface AdminEventFields {
  slug: string;
  name: string;
  iconName?: string;
  iconImageUrl?: string | null;
  description: string;
  bannerUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export async function createEvent(fields: AdminEventFields): Promise<Event> {
  const row = await prisma.event.create({
    data: {
      id: crypto.randomUUID(),
      slug: fields.slug,
      name: fields.name,
      iconName: fields.iconName || "",
      iconImageUrl: fields.iconImageUrl || null,
      description: fields.description,
      bannerUrl: fields.bannerUrl || null,
      startsAt: fields.startsAt || null,
      endsAt: fields.endsAt || null,
      couponId: [],
    },
  });
  purgeTag("events:list");
  return toEvent(row, []);
}

export async function updateEvent(id: string, fields: AdminEventFields): Promise<Event> {
  const row = await prisma.event.update({
    where: { id },
    data: {
      slug: fields.slug,
      name: fields.name,
      iconName: fields.iconName || "",
      iconImageUrl: fields.iconImageUrl || null,
      description: fields.description,
      bannerUrl: fields.bannerUrl || null,
      startsAt: fields.startsAt || null,
      endsAt: fields.endsAt || null,
    },
  });
  purgeTag("events:list");
  purgeTag(`event:${row.slug}`);
  const stores = await prisma.store.findMany({ where: { eventId: id }, select: { id: true } });
  return toEvent(row, stores.map((s) => s.id));
}

// A store belongs to at most one event in the admin UI, so this replaces
// whatever event it was previously assigned to rather than adding to it.
export async function setStoreEvent(storeId: string, eventId: string | null): Promise<void> {
  const previous = await prisma.store.findUnique({ where: { id: storeId }, select: { eventId: true } });
  const row = await prisma.store.update({ where: { id: storeId }, data: { eventId } });

  // A store joining an event pre-seeds its exclusive coupons into the
  // event's curated list, so the admin doesn't have to hunt for them by
  // hand — they can still add/remove coupons afterwards from EventForm.
  if (eventId && eventId !== previous?.eventId) {
    const exclusiveCoupons = await prisma.coupon.findMany({
      where: { storeId, exclusive: true, isActive: true },
      select: { id: true },
    });
    if (exclusiveCoupons.length > 0) {
      const targetEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: { couponId: true },
      });
      if (targetEvent) {
        const merged = Array.from(
          new Set([...targetEvent.couponId, ...exclusiveCoupons.map((c) => c.id)])
        );
        await prisma.event.update({ where: { id: eventId }, data: { couponId: merged } });
      }
    }
  }

  const affectedIds = new Set([previous?.eventId, eventId].filter((x): x is string => Boolean(x)));
  if (affectedIds.size > 0) {
    const affectedEvents = await prisma.event.findMany({
      where: { id: { in: [...affectedIds] } },
      select: { slug: true },
    });
    for (const event of affectedEvents) purgeTag(`event:${event.slug}`);
  }
  purgeTag("events:list");
  purgeTag("stores:list");
  purgeTag(`store:${row.slug}`);
}

// An event curates multiple coupons, so this is a plain replace-all of the
// couponId array on the event row.
export async function setEventCoupons(eventId: string, couponIds: string[]): Promise<void> {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { couponId: couponIds },
    select: { slug: true },
  });
  purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
}
