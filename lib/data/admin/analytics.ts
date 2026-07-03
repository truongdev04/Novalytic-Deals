import { prisma } from "@/lib/server/db";

// Only click-derived metrics are exposed here. "Revenue estimate" / true CVR
// would need order/conversion data from affiliate network postbacks, which
// this domain model doesn't have — scoped out rather than faked.
const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardRange = "today" | "yesterday" | "7d" | "month" | "custom" | "all";

export interface ResolvedRange {
  since: Date | null;
  until: Date | null;
  bucket: "hour" | "day";
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function resolveDashboardRange(
  range: DashboardRange,
  from?: string,
  to?: string,
): ResolvedRange {
  const now = new Date();
  switch (range) {
    case "today":
      return { since: startOfDay(now), until: null, bucket: "hour" };
    case "yesterday": {
      const since = new Date(startOfDay(now).getTime() - DAY_MS);
      const until = startOfDay(now);
      return { since, until, bucket: "hour" };
    }
    case "7d":
      return { since: new Date(startOfDay(now).getTime() - 6 * DAY_MS), until: null, bucket: "day" };
    case "month":
      return { since: new Date(now.getFullYear(), now.getMonth(), 1), until: null, bucket: "day" };
    case "custom": {
      const since = from ? startOfDay(new Date(from)) : null;
      const until = to ? new Date(startOfDay(new Date(to)).getTime() + DAY_MS) : null;
      return { since, until, bucket: "day" };
    }
    case "all":
    default:
      return { since: null, until: null, bucket: "day" };
  }
}

export async function getOverviewCounts() {
  const [stores, coupons, deals, categories, blogPosts, subscribers] = await Promise.all([
    prisma.store.count(),
    prisma.coupon.count(),
    prisma.coupon.count({ where: { type: "DEAL" } }),
    prisma.category.count(),
    prisma.blogPost.count(),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  return { stores, coupons, deals, categories, blogPosts, subscribers };
}

export async function getClickTotals(days = 30) {
  const since = new Date(Date.now() - days * DAY_MS);
  const totalClicks = await prisma.clickEvent.count({ where: { createdAt: { gte: since } } });
  return { totalClicks, days };
}

export async function getTopStoresByClicks(limit = 5, days = 30) {
  const since = new Date(Date.now() - days * DAY_MS);
  return getTopStoresByClicksRange(limit, since, null);
}

export async function getTopStoresByClicksRange(
  limit: number,
  since: Date | null,
  until: Date | null,
) {
  const grouped = await prisma.clickEvent.groupBy({
    by: ["storeId"],
    where: {
      createdAt: {
        ...(since ? { gte: since } : {}),
        ...(until ? { lt: until } : {}),
      },
    },
    _count: { storeId: true },
    orderBy: { _count: { storeId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const stores = await prisma.store.findMany({
    where: { id: { in: grouped.map((g) => g.storeId) } },
  });
  const nameById = new Map(stores.map((s) => [s.id, s.name]));

  return grouped.map((g) => ({
    storeId: g.storeId,
    storeName: nameById.get(g.storeId) ?? "Unknown store",
    clicks: g._count.storeId,
  }));
}

export async function getTopCouponsByClicks(limit = 5, days = 30) {
  const since = new Date(Date.now() - days * DAY_MS);
  const grouped = await prisma.clickEvent.groupBy({
    by: ["couponId"],
    where: { createdAt: { gte: since } },
    _count: { couponId: true },
    orderBy: { _count: { couponId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const coupons = await prisma.coupon.findMany({
    where: { id: { in: grouped.map((g) => g.couponId) } },
  });
  const titleById = new Map(coupons.map((c) => [c.id, c.title]));

  return grouped.map((g) => ({
    couponId: g.couponId,
    couponTitle: titleById.get(g.couponId) ?? "Unknown coupon",
    clicks: g._count.couponId,
  }));
}

export async function getClicksByDay(days = 14) {
  const since = new Date(Date.now() - days * DAY_MS);
  const rows = await prisma.clickEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: { date: string; clicks: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    series.push({ date, clicks: counts.get(date) ?? 0 });
  }
  return series;
}

export interface ClicksSeriesPoint {
  label: string;
  clicks: number;
}

export async function getClicksSeriesForRange(
  since: Date | null,
  until: Date | null,
  bucket: "hour" | "day",
): Promise<ClicksSeriesPoint[]> {
  const rangeEnd = until ?? new Date();
  const rangeStart = since ?? (await getEarliestClickDate()) ?? startOfDay(rangeEnd);

  const rows = await prisma.clickEvent.findMany({
    where: {
      createdAt: {
        gte: rangeStart,
        lt: rangeEnd,
      },
    },
    select: { createdAt: true },
  });

  if (bucket === "hour") {
    const counts = new Map<number, number>();
    for (const row of rows) counts.set(row.createdAt.getHours(), (counts.get(row.createdAt.getHours()) ?? 0) + 1);
    const series: ClicksSeriesPoint[] = [];
    for (let h = 0; h < 24; h++) {
      series.push({ label: `${h.toString().padStart(2, "0")}:00`, clicks: counts.get(h) ?? 0 });
    }
    return series;
  }

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: ClicksSeriesPoint[] = [];
  const totalDays = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / DAY_MS));
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(rangeStart.getTime() + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    series.push({ label: key.slice(5), clicks: counts.get(key) ?? 0 });
  }
  return series;
}

async function getEarliestClickDate() {
  const first = await prisma.clickEvent.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } });
  return first?.createdAt ?? null;
}

export async function getModerationCounts() {
  const [pendingReviews, pendingSubmissions] = await Promise.all([
    prisma.review.count({ where: { isApproved: false } }),
    prisma.submittedCoupon.count({ where: { status: "PENDING" } }),
  ]);
  return { pendingReviews, pendingSubmissions };
}

export interface RecentActivityItem {
  id: string;
  title: string;
  kind: "Blog Post" | "Coupon";
  createdAt: Date;
}

export async function getRecentActivity(limit = 5): Promise<RecentActivityItem[]> {
  const [posts, coupons] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { id: true, title: true, publishedAt: true },
    }),
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const items: RecentActivityItem[] = [
    ...posts.map((p) => ({ id: p.id, title: p.title, kind: "Blog Post" as const, createdAt: p.publishedAt })),
    ...coupons.map((c) => ({ id: c.id, title: c.title, kind: "Coupon" as const, createdAt: c.createdAt })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
