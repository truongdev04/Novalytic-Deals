import { prisma } from "@/lib/server/db";

export interface LogClickInput {
  couponId: string;
  storeId: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  sessionId?: string;
}

export async function logClickEvent(input: LogClickInput) {
  await prisma.clickEvent.create({ data: input });
}
