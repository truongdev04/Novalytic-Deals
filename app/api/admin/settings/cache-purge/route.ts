import type { NextRequest } from "next/server";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { KNOWN_CACHE_TAGS } from "@/lib/server/cache/tags";
import { cachePurgeSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = cachePurgeSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid purge request");

  if ("all" in parsed.data) {
    for (const tag of KNOWN_CACHE_TAGS) purgeTag(tag);
    return jsonOk({ purged: KNOWN_CACHE_TAGS.length });
  }

  if (!(KNOWN_CACHE_TAGS as readonly string[]).includes(parsed.data.tag)) {
    return jsonError(400, "Unknown cache tag");
  }
  purgeTag(parsed.data.tag);
  return jsonOk({ purged: 1 });
}
