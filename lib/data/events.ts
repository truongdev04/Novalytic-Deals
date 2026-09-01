import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma } from "@/lib/server/db";
import { deleteUploadedImages, removedImageUrls } from "@/lib/server/storage/deleteImage";
import { stripUndefined } from "./normalize";
import type { Event } from "@/types";
import type { Event as PrismaEvent } from "@prisma/client";

function toEvent(row: PrismaEvent, storeIds: string[], couponIds: string[]): Event {
  return stripUndefined({
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
    featuredCouponIds: couponIds,
    curatedCouponIds: row.curatedCouponIds ?? [],
    createdAt: row.createdAt.toISOString(),
  });
}

// How many coupons the public event page's "Curated deals" section tops out
// at — the randomize action fills up to this many, the store-leave backfill
// tops back up to whatever the list held before.
export const EVENT_CURATED_COUPON_LIMIT = 20;

// One batched query for all events' store links, grouped in JS — avoids an
// N+1 when listing every event.
async function storeIdsByEventId(eventIds: string[]): Promise<Map<string, string[]>> {
  const stores = await prisma.store.findMany({
    where: { eventId: { in: eventIds } },
    select: { id: true, eventId: true },
    orderBy: { id: "asc" },
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

// Same batching approach as storeIdsByEventId, for the event_coupons join
// table.
async function couponIdsByEventId(eventIds: string[]): Promise<Map<string, string[]>> {
  const rows = await prisma.eventCoupon.findMany({
    where: { eventId: { in: eventIds } },
    select: { eventId: true, couponId: true },
    orderBy: { couponId: "asc" },
  });
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.eventId) ?? [];
    list.push(r.couponId);
    map.set(r.eventId, list);
  }
  return map;
}

export const getEvents = unstable_cache(
  async (): Promise<Event[]> => {
    const rows = await prisma.event.findMany({ orderBy: [{ startsAt: "asc" }, { id: "asc" }] });
    const eventIds = rows.map((r) => r.id);
    const [byStore, byCoupon] = await Promise.all([
      storeIdsByEventId(eventIds),
      couponIdsByEventId(eventIds),
    ]);
    return rows
      .map((row) => toEvent(row, byStore.get(row.id) ?? [], byCoupon.get(row.id) ?? []))
      .sort(
        (a, b) =>
          new Date(a.startsAt ?? "9999-12-31").getTime() -
            new Date(b.startsAt ?? "9999-12-31").getTime() ||
          // Event chưa đặt startsAt đều rơi về cùng sentinel, nên không có
          // tiebreak thì thứ tự phụ thuộc thứ tự Prisma trả về.
          a.id.localeCompare(b.id)
      );
  },
  ["events:list"],
  { tags: ["events:list"], revalidate: false }
);

export interface AdminEventFilters {
  createdById?: string;
}

// Admin-only, ownership-scoped counterpart to getEvents() above — used
// exclusively by the admin list page so a data-scoped editor only sees their
// own events. getEvents() itself stays unfiltered/untouched since other
// pages (event pickers on Store/Deal forms) rely on it returning every
// event regardless of who's logged in.
export async function getEventsAdmin(filters: AdminEventFilters = {}): Promise<Event[]> {
  const scopeKey = filters.createdById ?? "all";
  return unstable_cache(
    async () => {
      const rows = await prisma.event.findMany({
        where: filters.createdById ? { createdById: filters.createdById } : undefined,
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      });
      const eventIds = rows.map((r) => r.id);
      const [byStore, byCoupon] = await Promise.all([
        storeIdsByEventId(eventIds),
        couponIdsByEventId(eventIds),
      ]);
      return rows
        .map((row) => toEvent(row, byStore.get(row.id) ?? [], byCoupon.get(row.id) ?? []))
        .sort(
          (a, b) =>
            new Date(a.startsAt ?? "9999-12-31").getTime() -
              new Date(b.startsAt ?? "9999-12-31").getTime() ||
            a.id.localeCompare(b.id)
        );
    },
    [`events:list:${scopeKey}`],
    { tags: ["events:list"], revalidate: false }
  )();
}

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.event.findUnique({ where: { slug } });
      if (!row) return undefined;
      const [stores, coupons] = await Promise.all([
        prisma.store.findMany({
          where: { eventId: row.id },
          select: { id: true },
          orderBy: { id: "asc" },
        }),
        prisma.eventCoupon.findMany({
          where: { eventId: row.id },
          select: { couponId: true },
          orderBy: { couponId: "asc" },
        }),
      ]);
      return toEvent(row, stores.map((s) => s.id), coupons.map((c) => c.couponId));
    },
    [`event:${slug}`],
    { tags: [`event:${slug}`], revalidate: false }
  )();
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const row = await prisma.event.findUnique({ where: { id } });
  if (!row) return undefined;
  const [stores, coupons] = await Promise.all([
    prisma.store.findMany({ where: { eventId: id }, select: { id: true }, orderBy: { id: "asc" } }),
    prisma.eventCoupon.findMany({
      where: { eventId: id },
      select: { couponId: true },
      orderBy: { couponId: "asc" },
    }),
  ]);
  return toEvent(row, stores.map((s) => s.id), coupons.map((c) => c.couponId));
}

export async function getEventOwnerId(id: string): Promise<string | undefined> {
  const row = await prisma.event.findUnique({ where: { id }, select: { createdById: true } });
  return row?.createdById ?? undefined;
}

export async function deleteEvent(id: string): Promise<void> {
  const storeCount = await prisma.store.count({ where: { eventId: id } });
  if (storeCount > 0) {
    throw new Error("EVENT_IN_USE");
  }

  const row = await prisma.event.delete({ where: { id } });
  purgeTag("events:list");
  purgeTag(`event:${row.slug}`);
  await deleteUploadedImages([row.bannerUrl, row.iconImageUrl]);
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

export interface AdminEventCreateFields extends AdminEventFields {
  createdById: string;
}

export async function createEvent(fields: AdminEventCreateFields): Promise<Event> {
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
      createdById: fields.createdById,
    },
  });
  purgeTag("events:list");
  return toEvent(row, [], []);
}

export async function updateEvent(id: string, fields: AdminEventFields): Promise<Event> {
  const previous = await prisma.event.findUnique({
    where: { id },
    select: { slug: true, bannerUrl: true, iconImageUrl: true },
  });
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
  if (previous && previous.slug !== row.slug) {
    purgeTag(`event:${previous.slug}`);
  }
  await deleteUploadedImages(
    removedImageUrls(
      previous,
      { bannerUrl: row.bannerUrl, iconImageUrl: row.iconImageUrl },
      ["bannerUrl", "iconImageUrl"]
    )
  );
  const [stores, coupons] = await Promise.all([
    prisma.store.findMany({ where: { eventId: id }, select: { id: true } }),
    prisma.eventCoupon.findMany({ where: { eventId: id }, select: { couponId: true } }),
  ]);
  return toEvent(row, stores.map((s) => s.id), coupons.map((c) => c.couponId));
}

// Adds `couponIds` to an event's curated list without duplicating entries
// already there — shared by the store-joins-event seed below and by
// syncCouponWithStoreEvent (called whenever a coupon write could make it
// newly eligible for its store's event).
async function unionCouponsIntoEvent(eventId: string, couponIds: string[]): Promise<void> {
  if (couponIds.length === 0) return;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) return;
  const { count } = await prisma.eventCoupon.createMany({
    data: couponIds.map((couponId) => ({ eventId, couponId })),
    skipDuplicates: true,
  });
  if (count === 0) return;
  purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
}

// Called after any coupon create/update/activate — pre-seeds it into its
// store's event the moment it becomes exclusive+active, not just when the
// store first joins the event.
export async function syncCouponWithStoreEvent(coupon: {
  id: string;
  storeId: string;
  exclusive: boolean;
  isActive: boolean;
}): Promise<void> {
  if (!coupon.exclusive || !coupon.isActive) return;
  const store = await prisma.store.findUnique({
    where: { id: coupon.storeId },
    select: { eventId: true },
  });
  if (!store?.eventId) return;
  await unionCouponsIntoEvent(store.eventId, [coupon.id]);
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
    await unionCouponsIntoEvent(eventId, exclusiveCoupons.map((c) => c.id));
  }

  // Leaving an event (switched to another one, or cleared) drops this
  // store's coupons from the old event's Featured Coupons join table and
  // from its public randomized "Curated deals" list — replacing the pulled
  // coupons in the latter with others still valid for that event.
  if (previous?.eventId && previous.eventId !== eventId) {
    const storeCoupons = await prisma.coupon.findMany({ where: { storeId }, select: { id: true } });
    if (storeCoupons.length > 0) {
      const storeCouponIds = storeCoupons.map((c) => c.id);
      await prisma.eventCoupon.deleteMany({
        where: { eventId: previous.eventId, couponId: { in: storeCouponIds } },
      });
      await reconcileCuratedCouponsAfterRemoval(previous.eventId, storeCouponIds);
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
// event_coupons rows for the event.
export async function setEventCoupons(eventId: string, couponIds: string[]): Promise<void> {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) return;
  await prisma.$transaction([
    prisma.eventCoupon.deleteMany({ where: { eventId } }),
    prisma.eventCoupon.createMany({
      data: couponIds.map((couponId) => ({ eventId, couponId })),
      skipDuplicates: true,
    }),
  ]);
  purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
}

// Active coupon ids of every store currently assigned to `eventId` — the
// pool both the randomize action and the store-leave backfill draw from.
async function eventCouponPool(eventId: string): Promise<string[]> {
  const stores = await prisma.store.findMany({ where: { eventId }, select: { id: true } });
  if (stores.length === 0) return [];
  const coupons = await prisma.coupon.findMany({
    where: { isActive: true, storeId: { in: stores.map((s) => s.id) } },
    select: { id: true },
  });
  return coupons.map((c) => c.id);
}

export interface RandomizeCuratedCouponsResult {
  events: number;
  totalCoupons: number;
}

// Admin action behind the "Randomize curated coupons" button. For each event
// id passed, replaces its public "Curated deals" list with up to
// EVENT_CURATED_COUPON_LIMIT of that event's own stores' active coupons,
// picked and ordered at random. Leaves the admin-picked Featured Coupons
// (eventCoupons join table) untouched.
export async function randomizeEventCuratedCoupons(
  eventIds: string[]
): Promise<RandomizeCuratedCouponsResult> {
  let totalCoupons = 0;
  for (const eventId of eventIds) {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (!event) continue;
    const pool = await eventCouponPool(eventId);
    const picked = shuffled(pool).slice(0, EVENT_CURATED_COUPON_LIMIT);
    await prisma.event.update({ where: { id: eventId }, data: { curatedCouponIds: picked } });
    purgeTag(`event:${event.slug}`);
    totalCoupons += picked.length;
  }
  if (eventIds.length > 0) purgeTag("events:list");
  return { events: eventIds.length, totalCoupons };
}

// After stores leave an event, drop their coupons from that event's
// randomized curated list and swap each pulled slot for another coupon
// still valid for the event (survivors keep their position; a slot vanishes
// only once the pool is exhausted).
async function reconcileCuratedCouponsAfterRemoval(
  eventId: string,
  removedCouponIds: string[]
): Promise<void> {
  if (removedCouponIds.length === 0) return;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { slug: true, curatedCouponIds: true },
  });
  if (!event) return;

  const removed = new Set(removedCouponIds);
  if (!event.curatedCouponIds.some((id) => removed.has(id))) return;

  const survivors = new Set(event.curatedCouponIds.filter((id) => !removed.has(id)));
  const replacements = shuffled(
    (await eventCouponPool(eventId)).filter((id) => !survivors.has(id))
  );

  const used = new Set(survivors);
  const next: string[] = [];
  for (const id of event.curatedCouponIds) {
    if (!removed.has(id)) {
      next.push(id);
      continue;
    }
    const replacement = replacements.find((r) => !used.has(r));
    if (replacement) {
      used.add(replacement);
      next.push(replacement);
    }
  }

  await prisma.event.update({ where: { id: eventId }, data: { curatedCouponIds: next } });
  purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
}

// Fisher-Yates — used by the bulk add/reset actions below to pick "any"
// (i.e. random) stores out of the eligible pool without favoring whichever
// ones happen to sort first.
function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class ResetExceedsAvailableError extends Error {
  constructor(public readonly available: number) {
    super("RESET_EXCEEDS_AVAILABLE");
  }
}

export interface BulkAssignResult {
  assigned: number;
}

// Admin bulk action: assigns `count` random active stores that currently
// belong to no event into `eventId`. Adds are cumulative across calls (only
// eventId=null, isActive=true stores are ever candidates) and silently
// assign fewer than requested — down to 0 — once the pool of eligible
// stores runs out, with no error surfaced for that case (by design, see the
// admin UI).
export async function bulkAssignStoresToEvent(
  eventId: string,
  count: number
): Promise<BulkAssignResult> {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) throw new Error("EVENT_NOT_FOUND");

  const candidates = await prisma.store.findMany({
    where: { eventId: null, isActive: true },
    select: { id: true, slug: true },
  });
  const targets = shuffled(candidates).slice(0, count);
  if (targets.length === 0) return { assigned: 0 };

  const targetIds = targets.map((s) => s.id);
  await prisma.store.updateMany({ where: { id: { in: targetIds } }, data: { eventId } });

  const exclusiveCoupons = await prisma.coupon.findMany({
    where: { storeId: { in: targetIds }, exclusive: true, isActive: true },
    select: { id: true },
  });
  await unionCouponsIntoEvent(eventId, exclusiveCoupons.map((c) => c.id));

  for (const store of targets) purgeTag(`store:${store.slug}`);
  purgeTag("stores:list");
  purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
  return { assigned: targets.length };
}

export interface BulkResetResult {
  reset: number;
}

// Admin bulk action: removes `count` (or every one of them, when `count` is
// "all") random stores currently in `eventId`, clearing their eventId and
// dropping their coupons from the event's curated list. Throws
// ResetExceedsAvailableError when `count` is more than the event currently
// has — the caller surfaces that as a validation message.
export async function bulkResetStoresFromEvent(
  eventId: string,
  count: number | "all"
): Promise<BulkResetResult> {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) throw new Error("EVENT_NOT_FOUND");

  const members = await prisma.store.findMany({
    where: { eventId },
    select: { id: true, slug: true },
  });
  if (count !== "all" && count > members.length) {
    throw new ResetExceedsAvailableError(members.length);
  }

  const targets = count === "all" ? members : shuffled(members).slice(0, count);
  if (targets.length === 0) return { reset: 0 };

  const targetIds = targets.map((s) => s.id);
  const storeCoupons = await prisma.coupon.findMany({
    where: { storeId: { in: targetIds } },
    select: { id: true },
  });

  const storeCouponIds = storeCoupons.map((c) => c.id);
  await prisma.$transaction([
    prisma.eventCoupon.deleteMany({
      where: { eventId, couponId: { in: storeCouponIds } },
    }),
    prisma.store.updateMany({ where: { id: { in: targetIds } }, data: { eventId: null } }),
  ]);

  // Same backfill as a single store leaving — the removed stores' coupons
  // drop out of the public curated list and get swapped for others still in
  // the event.
  await reconcileCuratedCouponsAfterRemoval(eventId, storeCouponIds);

  for (const store of targets) purgeTag(`store:${store.slug}`);
  purgeTag("stores:list");
  purgeTag(`event:${event.slug}`);
  purgeTag("events:list");
  return { reset: targets.length };
}
