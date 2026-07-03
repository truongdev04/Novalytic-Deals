import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSiteMeta, setSiteMeta } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

const siteMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  ogImage: z.string().optional(),
});

export async function GET() {
  const meta = await getSiteMeta();
  return jsonOk(meta);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = siteMetaSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid settings data");

  const meta = await setSiteMeta(parsed.data);
  return jsonOk(meta);
}
