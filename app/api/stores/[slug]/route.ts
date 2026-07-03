import type { NextRequest } from "next/server";
import { getStoreBySlug } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return jsonError(404, "Store not found");
  return jsonOk(store);
}
