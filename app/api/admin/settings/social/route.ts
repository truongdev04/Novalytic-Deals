import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSocialSettings, setSocialSettings } from "@/lib/data";
import { adminSocialSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const settings = await getSocialSettings();
  return jsonOk(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminSocialSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setSocialSettings(parsed.data);
  revalidatePath("/", "layout");
  return jsonOk(settings);
}
