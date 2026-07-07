import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getGeneralSettings, setGeneralSettings } from "@/lib/data";
import { adminGeneralSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const settings = await getGeneralSettings();
  return jsonOk(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminGeneralSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setGeneralSettings(parsed.data);
  revalidatePath("/", "layout");
  return jsonOk(settings);
}
