import { prisma } from "@/lib/server/db";

export async function upsertNewsletterSubscriber(email: string, source?: string) {
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, source, tags: [] },
    update: {},
  });
}

export async function confirmNewsletterSubscriber(email: string) {
  await prisma.newsletterSubscriber.updateMany({
    where: { email },
    data: { confirmedAt: new Date() },
  });
}

export async function unsubscribeNewsletterSubscriber(email: string) {
  await prisma.newsletterSubscriber.updateMany({
    where: { email },
    data: { unsubscribedAt: new Date() },
  });
}

export async function getNewsletterSubscribers() {
  return prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
}

// Admin-facing paginated list — DB-level pagination instead of fetching
// every subscriber into memory (this table has no natural ceiling, unlike
// admin-curated tables like Category/Event).
export async function getNewsletterSubscribersAdminPaginated(page: number, pageSize: number) {
  const [items, total] = await prisma.$transaction([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.newsletterSubscriber.count(),
  ]);
  return { items, total };
}

export async function getConfirmedActiveSubscriberCount() {
  return prisma.newsletterSubscriber.count({
    where: { confirmedAt: { not: null }, unsubscribedAt: null },
  });
}

export async function unsubscribeNewsletterSubscriberById(id: string) {
  await prisma.newsletterSubscriber.update({
    where: { id },
    data: { unsubscribedAt: new Date() },
  });
}

export async function deleteNewsletterSubscriber(id: string) {
  await prisma.newsletterSubscriber.delete({ where: { id } });
}
