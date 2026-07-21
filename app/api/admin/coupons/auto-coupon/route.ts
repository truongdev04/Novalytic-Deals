import type { NextRequest } from "next/server";
import { setCouponRefreshSettings } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { purgeTag } from "@/lib/server/cache/purgeTag";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return jsonError(400, "Invalid request");
  }
  const settings = await setCouponRefreshSettings({ autoCouponEnabled: body.enabled });
  purgeTag("settings:coupon-refresh");
  return jsonOk(settings);
}
