import type { NextRequest } from "next/server";
import { filterCoupons, searchStores } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { searchRateLimit } from "@/lib/server/cache/rateLimit";

// Phase 1 search per CLAUDE.md: Postgres ILIKE via Prisma's case-insensitive
// `contains` filter (used inside searchStores/filterCoupons). Trigram-ranked
// fuzzy search and Meilisearch/Algolia are explicitly deferred to Phase 2.
export async function GET(request: NextRequest) {
  const rateLimited = await enforceRateLimit(searchRateLimit, getClientIp(request));
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return jsonOk({ stores: [], coupons: [] });
  }

  // Quick-search endpoint (SearchAutocomplete) — only ever needs a short
  // suggestion list, not the full matching set, so cap both queries at the
  // DB level instead of fetching everything.
  const [stores, coupons] = await Promise.all([
    searchStores(q, { take: 10, nameStartsWith: true }),
    filterCoupons({ query: q, limit: 8 }),
  ]);

  return jsonOk({ stores, coupons });
}
