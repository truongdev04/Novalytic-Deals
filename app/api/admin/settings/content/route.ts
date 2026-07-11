import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getContentConfigSettings, setContentConfigSettings } from "@/lib/data";
import { adminContentConfigSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const settings = await getContentConfigSettings();
  return jsonOk(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminContentConfigSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setContentConfigSettings(parsed.data);
  revalidatePath("/", "layout");
  return jsonOk(settings);
}
