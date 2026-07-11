import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSeoSettings, setSeoSettings } from "@/lib/data";
import { adminSeoSettingsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const settings = await getSeoSettings();
  return jsonOk(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminSeoSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const settings = await setSeoSettings(parsed.data);
  revalidatePath("/", "layout");
  return jsonOk(settings);
}
