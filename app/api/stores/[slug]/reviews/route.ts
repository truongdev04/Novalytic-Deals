import type { NextRequest } from "next/server";
import { createReview, getStoreBySlug } from "@/lib/data";
import { reviewSchema } from "@/lib/validators/review";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { reviewRateLimit } from "@/lib/server/cache/rateLimit";
import { verifyTurnstileToken } from "@/lib/server/security/turnstile";
import { isHoneypotTripped } from "@/lib/server/security/honeypot";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(reviewRateLimit, ip);
  if (rateLimited) return rateLimited;

  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return jsonError(404, "Store not found");

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid review submission");

  if (isHoneypotTripped(parsed.data.honeypot)) {
    return jsonOk({ submitted: true });
  }

  const verified = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!verified) return jsonError(400, "Verification failed. Please try again.");

  await createReview({
    storeId: store.id,
    authorName: parsed.data.authorName,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  return jsonOk({ submitted: true });
}
