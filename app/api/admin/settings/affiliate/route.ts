import type { NextRequest } from "next/server";
import {
  getAffiliateSettings,
  getEffectiveDefaultAffiliateNetwork,
  setAffiliateSettings,
} from "@/lib/data";
import { adminAffiliateSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const [settings, effectiveDefaultAffiliateNetwork] = await Promise.all([
    getAffiliateSettings(),
    getEffectiveDefaultAffiliateNetwork(),
  ]);
  return jsonOk({ ...settings, effectiveDefaultAffiliateNetwork });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminAffiliateSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setAffiliateSettings(parsed.data);
  return jsonOk(settings);
}
