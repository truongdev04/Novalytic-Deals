import type { NextRequest } from "next/server";
import { createBlogPost, getBlogPosts } from "@/lib/data";
import { adminBlogPostSchema } from "@/lib/validators/admin/blog";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const posts = await getBlogPosts();
  return jsonOk(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminBlogPostSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid blog post data");

  const post = await createBlogPost({
    slug: parsed.data.slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    coverImage: parsed.data.coverImage,
    authorId: parsed.data.authorId,
    tags: parsed.data.tags
      ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    categoryId: parsed.data.categoryId || null,
    body: parsed.data.body,
    readingMinutes: parsed.data.readingMinutes,
    publishedAt: new Date(parsed.data.publishedAt),
    isFeatured: parsed.data.isFeatured,
    seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
  });

  return jsonOk(post, 201);
}
