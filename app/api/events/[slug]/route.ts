import type { NextRequest } from "next/server";
import { getEventBySlug } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return jsonError(404, "Event not found");
  return jsonOk(event);
}
