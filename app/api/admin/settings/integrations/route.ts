import type { NextRequest } from "next/server";
import { getIntegrationsSettingsView, setIntegrationsSettings } from "@/lib/data";
import { adminIntegrationsSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const view = await getIntegrationsSettingsView();
  return jsonOk(view);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminIntegrationsSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const view = await setIntegrationsSettings(parsed.data);
  return jsonOk(view);
}
