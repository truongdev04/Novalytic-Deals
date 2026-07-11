import { prisma } from "@/lib/server/db";

// "Revenue estimate" / true CVR would need order/conversion data from
// affiliate network postbacks, which this domain model doesn't have —
// scoped out rather than faked.

export async function getOverviewCounts() {
  const [stores, coupons, deals, categories, blogPosts, subscribers] = await Promise.all([
    prisma.store.count(),
    prisma.coupon.count(),
    prisma.deal.count(),
    prisma.category.count(),
    prisma.blogPost.count(),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);
  return { stores, coupons, deals, categories, blogPosts, subscribers };
}

export interface TopStoreByClicks {
  storeId: string;
  storeName: string;
  clicks: number;
}

export async function getTopStoresByClickCount(limit = 5): Promise<TopStoreByClicks[]> {
  const stores = await prisma.store.findMany({
    where: { clickCount: { gt: 0 } },
    orderBy: { clickCount: "desc" },
    take: limit,
  });
  return stores.map((s) => ({ storeId: s.id, storeName: s.name, clicks: s.clickCount }));
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
