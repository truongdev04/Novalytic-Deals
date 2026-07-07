import type { NextRequest } from "next/server";
import {
  deleteBlogPost,
  getBlogPostById,
  setBlogPostActive,
  setBlogPostFeatured,
  setBlogPostFirst,
  updateBlogPost,
} from "@/lib/data";
import { adminBlogPostSchema } from "@/lib/validators/admin/blog";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) return jsonError(404, "Blog post not found");
  return jsonOk(post);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick toggle from the list page sends only { isFeatured }; the full
  // edit form sends the complete adminBlogPostSchema shape.
  const fullUpdate = adminBlogPostSchema.safeParse(body);
  if (fullUpdate.success) {
    const post = await updateBlogPost(id, {
      slug: fullUpdate.data.slug,
      title: fullUpdate.data.title,
      excerpt: fullUpdate.data.excerpt,
      coverImage: fullUpdate.data.coverImage,
      authorName: fullUpdate.data.authorName || "NovalyticDeals",
      authorAvatarUrl: fullUpdate.data.authorAvatarUrl || "/images/logo/logo/app-icon.png",
      tags: fullUpdate.data.tags,
      categoryId: fullUpdate.data.categoryId || null,
      topicId: fullUpdate.data.topicId || null,
      body: fullUpdate.data.body,
      readingMinutes: fullUpdate.data.readingMinutes,
      publishedAt: new Date(fullUpdate.data.publishedAt),
      isFeatured: fullUpdate.data.isFeatured,
      isFirst: fullUpdate.data.isFirst,
      seo: { title: fullUpdate.data.seoTitle, description: fullUpdate.data.seoDescription },
    });
    return jsonOk(post);
  }

  if (typeof body?.isFeatured === "boolean") {
    const post = await setBlogPostFeatured(id, body.isFeatured);
    return jsonOk(post);
  }

  if (typeof body?.isFirst === "boolean") {
    const post = await setBlogPostFirst(id, body.isFirst);
    return jsonOk(post);
  }

  if (typeof body?.isActive === "boolean") {
    const post = await setBlogPostActive(id, body.isActive);
    return jsonOk(post);
  }

  return jsonError(400, "Invalid blog post data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteBlogPost(id);
  return jsonOk({ deleted: true });
}
