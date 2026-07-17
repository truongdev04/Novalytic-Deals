import type { NextRequest } from "next/server";
import { setDealRefreshSettings } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { purgeTag } from "@/lib/server/cache/purgeTag";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return jsonError(400, "Invalid request");
  }
  const settings = await setDealRefreshSettings({ autoDealEnabled: body.enabled });
  purgeTag("settings:deal-refresh");
  return jsonOk(settings);
}
