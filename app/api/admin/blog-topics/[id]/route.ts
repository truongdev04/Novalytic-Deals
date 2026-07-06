import type { NextRequest } from "next/server";
import { deleteBlogTopic, getBlogTopicById, updateBlogTopic } from "@/lib/data";
import { adminBlogTopicSchema } from "@/lib/validators/admin/blogTopic";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getBlogTopicById(id);
  if (!topic) return jsonError(404, "Topic not found");
  return jsonOk(topic);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminBlogTopicSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid topic data");

  try {
    const topic = await updateBlogTopic(id, {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
    return jsonOk(topic);
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return jsonError(409, "This slug is already in use. Please choose another one.");
    }
    return jsonError(500, "Failed to save topic");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteBlogTopic(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "TOPIC_IN_USE") {
      return jsonError(
        409,
        "Cannot delete this topic because it still has posts assigned to it. Remove it from those posts first."
      );
    }
    return jsonError(500, "Failed to delete topic");
  }
}
