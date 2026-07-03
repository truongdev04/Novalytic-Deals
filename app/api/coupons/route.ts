import type { NextRequest } from "next/server";
import { filterCoupons, type CouponFilters } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: CouponFilters = {
    storeSlug: searchParams.get("store") ?? undefined,
    categoryId: searchParams.get("category") ?? undefined,
    type: (searchParams.get("type") as CouponFilters["type"]) ?? undefined,
    query: searchParams.get("q") ?? undefined,
    sort: (searchParams.get("sort") as CouponFilters["sort"]) ?? undefined,
    includeExpired: searchParams.get("includeExpired") === "true",
  };

  const coupons = await filterCoupons(filters);
  return jsonOk(coupons);
}
