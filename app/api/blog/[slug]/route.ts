import type { NextRequest } from "next/server";
import { getBlogPostBySlug } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return jsonError(404, "Blog post not found");
  return jsonOk(post);
}
