import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getCustomScriptsSettings, setCustomScriptsSettings } from "@/lib/data";
import { adminCustomScriptsSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const settings = await getCustomScriptsSettings();
  return jsonOk(settings);
}

export async function PATCH(request: NextRequest) {
  // Extra role check beyond the middleware's permission gate: this endpoint
  // can inject scripts that run on every public page, so an EDITOR granted
  // settings_scripts (which passes middleware and the nav link) must still
  // be blocked here the same way the /admin/settings/scripts page blocks
  // them — otherwise they could call this route directly despite the UI
  // gate rejecting them.
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return jsonError(403, "Forbidden");
  }

  const body = await request.json().catch(() => null);
  const parsed = adminCustomScriptsSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setCustomScriptsSettings(parsed.data);
  revalidatePath("/", "layout");
  return jsonOk(settings);
}
