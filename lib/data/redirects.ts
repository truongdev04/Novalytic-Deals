import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import { redis } from "@/lib/server/cache/redis";
import type { RedirectRule, RedirectType } from "@/types";
import type { RedirectRule as PrismaRedirectRule } from "@prisma/client";

const REDIS_ACTIVE_KEY = "redirects:active";

function toRedirectRule(row: PrismaRedirectRule): RedirectRule {
  return {
    id: row.id,
    source: row.source,
    destination: row.destination,
    type: row.type as RedirectType,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function throwIfSourceConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes("source")
  ) {
    throw new Error("SOURCE_TAKEN");
  }
  throw error;
}

// Mirrors the current set of active rules into Redis so the Edge middleware
// can look up a redirect by pathname without calling Prisma. No-op if Redis
// isn't configured (dev/local).
async function syncRedisMirror(): Promise<void> {
  if (!redis) return;
  const rows = await prisma.redirectRule.findMany({ where: { isActive: true } });
  await redis.del(REDIS_ACTIVE_KEY);
  if (rows.length === 0) return;
  const entries: Record<string, { destination: string; type: RedirectType }> = {};
  for (const row of rows) {
    entries[row.source] = { destination: row.destination, type: row.type };
  }
  await redis.hset(REDIS_ACTIVE_KEY, entries);
}

export const getAllRedirectRules = unstable_cache(
  async (): Promise<RedirectRule[]> => {
    const rows = await prisma.redirectRule.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toRedirectRule);
  },
  ["redirects:list"],
  { tags: ["redirects:list"], revalidate: 300 }
);

export async function getRedirectRuleById(id: string): Promise<RedirectRule | undefined> {
  const all = await getAllRedirectRules();
  return all.find((r) => r.id === id);
}

export interface AdminRedirectRuleFields {
  source: string;
  destination: string;
  type: RedirectType;
  isActive: boolean;
}

export async function createRedirectRule(fields: AdminRedirectRuleFields): Promise<RedirectRule> {
  try {
    const row = await prisma.redirectRule.create({ data: fields });
    purgeTag("redirects:list");
    await syncRedisMirror();
    return toRedirectRule(row);
  } catch (error) {
    throwIfSourceConflict(error);
  }
}

export async function updateRedirectRule(
  id: string,
  fields: AdminRedirectRuleFields
): Promise<RedirectRule> {
  try {
    const row = await prisma.redirectRule.update({ where: { id }, data: fields });
    purgeTag("redirects:list");
    await syncRedisMirror();
    return toRedirectRule(row);
  } catch (error) {
    throwIfSourceConflict(error);
  }
}

export async function setRedirectRuleActive(id: string, isActive: boolean): Promise<RedirectRule> {
  const row = await prisma.redirectRule.update({ where: { id }, data: { isActive } });
  purgeTag("redirects:list");
  await syncRedisMirror();
  return toRedirectRule(row);
}

export async function deleteRedirectRule(id: string): Promise<void> {
  await prisma.redirectRule.delete({ where: { id } });
  purgeTag("redirects:list");
  await syncRedisMirror();
}
