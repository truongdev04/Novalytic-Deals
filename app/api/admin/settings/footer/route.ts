import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getFooterSettings, setFooterSettings } from "@/lib/data";
import { adminFooterSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const settings = await getFooterSettings();
  return jsonOk(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminFooterSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setFooterSettings(parsed.data);
  revalidatePath("/", "layout");
  return jsonOk(settings);
}
