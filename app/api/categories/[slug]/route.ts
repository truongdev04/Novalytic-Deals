import type { NextRequest } from "next/server";
import { getCategoryBySlug } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return jsonError(404, "Category not found");
  return jsonOk(category);
}
