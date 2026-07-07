import type { NextRequest } from "next/server";
import { createBlogPost, getAllBlogPosts } from "@/lib/data";
import { adminBlogPostSchema } from "@/lib/validators/admin/blog";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const posts = await getAllBlogPosts();
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
    authorName: parsed.data.authorName || "NovalyticDeals",
    authorAvatarUrl: parsed.data.authorAvatarUrl || "/images/logo/logo/app-icon.png",
    tags: parsed.data.tags,
    categoryId: parsed.data.categoryId || null,
    topicId: parsed.data.topicId || null,
    body: parsed.data.body,
    readingMinutes: parsed.data.readingMinutes,
    publishedAt: new Date(parsed.data.publishedAt),
    isFeatured: parsed.data.isFeatured,
    isFirst: parsed.data.isFirst,
    seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
  });

  return jsonOk(post, 201);
}
