import type { NextRequest } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";
import { checkRateLimit } from "@/lib/server/cache/rateLimit";
import { jsonError } from "./response";

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function enforceRateLimit(limiter: Ratelimit | null, identifier: string) {
  const { success } = await checkRateLimit(limiter, identifier);
  if (!success) {
    return jsonError(429, "Too many requests. Please try again later.");
  }
  return null;
}
