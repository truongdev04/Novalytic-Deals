import { prisma, Prisma } from "@/lib/server/db";

export interface SiteMeta {
  title: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImage?: string;
}

const SITE_META_KEY = "site_meta";

export async function getSiteMeta(): Promise<SiteMeta | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SITE_META_KEY } });
  return row ? (row.value as unknown as SiteMeta) : null;
}

export async function setSiteMeta(meta: SiteMeta): Promise<SiteMeta> {
  const row = await prisma.siteSetting.upsert({
    where: { key: SITE_META_KEY },
    create: { key: SITE_META_KEY, value: meta as unknown as Prisma.InputJsonValue },
    update: { value: meta as unknown as Prisma.InputJsonValue },
  });
  return row.value as unknown as SiteMeta;
}
