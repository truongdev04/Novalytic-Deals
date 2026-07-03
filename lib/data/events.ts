import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma } from "@/lib/server/db";
import type { Event } from "@/types";
import type { Event as PrismaEvent, EventStore, EventCoupon } from "@prisma/client";

type EventRow = PrismaEvent & {
  featuredStores: EventStore[];
  featuredCoupons: EventCoupon[];
};

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    iconName: row.iconName,
    description: row.description,
    bannerUrl: row.bannerUrl ?? undefined,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    featuredStoreIds: row.featuredStores.map((s) => s.storeId),
    featuredCouponIds: row.featuredCoupons.map((c) => c.couponId),
  };
}

export const getEvents = unstable_cache(
  async (): Promise<Event[]> => {
    const rows = await prisma.event.findMany({
      include: { featuredStores: true, featuredCoupons: true },
    });
    return rows
      .map(toEvent)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  },
  ["events:list"],
  { tags: ["events:list"], revalidate: 300 }
);

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.event.findUnique({
        where: { slug },
        include: { featuredStores: true, featuredCoupons: true },
      });
      return row ? toEvent(row) : undefined;
    },
    [`event:${slug}`],
    { tags: [`event:${slug}`], revalidate: 300 }
  )();
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const row = await prisma.event.findUnique({
    where: { id },
    include: { featuredStores: true, featuredCoupons: true },
  });
  return row ? toEvent(row) : undefined;
}

export async function deleteEvent(id: string): Promise<void> {
  const row = await prisma.event.delete({ where: { id } });
  purgeTag("events:list");
  purgeTag(`event:${row.slug}`);
}

export interface AdminEventFields {
  slug: string;
  name: string;
  iconName: string;
  description: string;
  bannerUrl?: string | null;
  startsAt: Date;
  endsAt: Date;
}

export async function createEvent(fields: AdminEventFields): Promise<Event> {
  const row = await prisma.event.create({
    data: {
      id: crypto.randomUUID(),
      slug: fields.slug,
      name: fields.name,
      iconName: fields.iconName,
      description: fields.description,
      bannerUrl: fields.bannerUrl || null,
      startsAt: fields.startsAt,
      endsAt: fields.endsAt,
    },
    include: { featuredStores: true, featuredCoupons: true },
  });
  purgeTag("events:list");
  return toEvent(row);
}

export async function updateEvent(id: string, fields: AdminEventFields): Promise<Event> {
  const row = await prisma.event.update({
    where: { id },
    data: {
      slug: fields.slug,
      name: fields.name,
      iconName: fields.iconName,
      description: fields.description,
      bannerUrl: fields.bannerUrl || null,
      startsAt: fields.startsAt,
      endsAt: fields.endsAt,
    },
    include: { featuredStores: true, featuredCoupons: true },
  });
  purgeTag("events:list");
  purgeTag(`event:${row.slug}`);
  return toEvent(row);
}

// A store belongs to at most one event in the admin UI, so this replaces
// whatever EventStore rows already exist for it rather than adding to them.
export async function setStoreEvent(storeId: string, eventId: string | null): Promise<void> {
  const previousLinks = await prisma.eventStore.findMany({
    where: { storeId },
    select: { eventId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.eventStore.deleteMany({ where: { storeId } });
    if (eventId) {
      await tx.eventStore.create({ data: { eventId, storeId } });
    }
  });

  const affectedIds = new Set(previousLinks.map((link) => link.eventId));
  if (eventId) affectedIds.add(eventId);
  if (affectedIds.size > 0) {
    const affectedEvents = await prisma.event.findMany({
      where: { id: { in: [...affectedIds] } },
      select: { slug: true },
    });
    for (const event of affectedEvents) purgeTag(`event:${event.slug}`);
  }
  purgeTag("events:list");
}

// A store belongs to at most one event, so assigning it here moves it out of
// whatever event it was previously featured in — reuses setStoreEvent so that
// invariant stays enforced from either direction (Store form or Event form).
export async function setEventStores(eventId: string, storeIds: string[]): Promise<void> {
  const existingLinks = await prisma.eventStore.findMany({
    where: { eventId },
    select: { storeId: true },
  });
  const existingIds = new Set(existingLinks.map((link) => link.storeId));
  const nextIds = new Set(storeIds);
  const removed = [...existingIds].filter((id) => !nextIds.has(id));

  await Promise.all([
    ...removed.map((storeId) => setStoreEvent(storeId, null)),
    ...storeIds.map((storeId) => setStoreEvent(storeId, eventId)),
  ]);
}

// Coupons aren't restricted to a single event, so this is a plain
// replace-all of the EventCoupon rows for this event.
export async function setEventCoupons(eventId: string, couponIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.eventCoupon.deleteMany({ where: { eventId } }),
    prisma.eventCoupon.createMany({ data: couponIds.map((couponId) => ({ eventId, couponId })) }),
  ]);

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event) purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
}
