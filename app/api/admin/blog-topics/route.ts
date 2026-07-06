import type { NextRequest } from "next/server";
import { createBlogTopic, getBlogTopics } from "@/lib/data";
import { adminBlogTopicSchema } from "@/lib/validators/admin/blogTopic";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const topics = await getBlogTopics();
  return jsonOk(topics);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminBlogTopicSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid topic data");

  try {
    const topic = await createBlogTopic({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
    return jsonOk(topic, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return jsonError(409, "This slug is already in use. Please choose another one.");
    }
    return jsonError(500, "Failed to save topic");
  }
}
