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

export async function unsubscribeNewsletterSubscriberById(id: string) {
  await prisma.newsletterSubscriber.update({
    where: { id },
    data: { unsubscribedAt: new Date() },
  });
}

export async function deleteNewsletterSubscriber(id: string) {
  await prisma.newsletterSubscriber.delete({ where: { id } });
}
