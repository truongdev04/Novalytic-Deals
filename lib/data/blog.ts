import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { BlogPost, BlogSeo } from "@/types";
import type { BlogPost as PrismaBlogPost } from "@prisma/client";

function toBlogPost(row: PrismaBlogPost): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    authorName: row.authorName,
    authorAvatarUrl: row.authorAvatarUrl ?? undefined,
    categoryId: row.categoryId ?? undefined,
    topicId: row.topicId ?? undefined,
    body: row.body,
    readingMinutes: row.readingMinutes,
    publishedAt: row.publishedAt.toISOString(),
    seo: row.seo as unknown as BlogSeo,
    isFeatured: row.isFeatured,
    isFirst: row.isFirst,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

const getAllBlogPostsCached = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const rows = await prisma.blogPost.findMany();
    return rows
      .map(toBlogPost)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },
  ["blog:list"],
  { tags: ["blog:list"], revalidate: 300 }
);

// Unfiltered — includes posts toggled off ("Status") for admin management.
// Public pages must use `getBlogPosts` instead.
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return getAllBlogPostsCached();
}

export interface AdminBlogFilters {
  query?: string;
  isFeatured?: boolean;
  isFirst?: boolean;
  isActive?: boolean;
}

// Admin-facing paginated list — sees hidden posts too, status is just
// another optional filter. Ordered newest-created-first (matches the admin
// page's previous client-side re-sort by createdAt, unlike the public
// getBlogPosts()'s publishedAt order).
export async function getBlogPostsAdminPaginated(
  filters: AdminBlogFilters,
  page: number,
  pageSize: number
): Promise<{ items: BlogPost[]; total: number }> {
  const where: Prisma.BlogPostWhereInput = {};
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.isFirst !== undefined) where.isFirst = filters.isFirst;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const q = filters.query?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { authorName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);
  return { items: rows.map(toBlogPost), total };
}

// Own query (not derived from getAllBlogPostsCached) so the public path
// never pulls inactive posts into memory. Same tag as getAllBlogPostsCached
// so existing purgeTag("blog:list") calls invalidate both.
const getActiveBlogPostsCached = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const rows = await prisma.blogPost.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toBlogPost);
  },
  ["blog:active"],
  { tags: ["blog:list"], revalidate: 300 }
);

export async function getBlogPosts(): Promise<BlogPost[]> {
  return getActiveBlogPostsCached();
}

// select-narrowed variant for card grids (blog index, related-posts rail)
// that never render the body — drops the @db.Text `body` column instead of
// pulling every post's full article HTML over the wire just to show a
// title/excerpt/cover image. Returns full BlogPost shape (body: "") so
// existing BlogCard-typed consumers don't need to change.
const BLOG_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  authorName: true,
  authorAvatarUrl: true,
  categoryId: true,
  topicId: true,
  readingMinutes: true,
  publishedAt: true,
  seo: true,
  isFeatured: true,
  isFirst: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.BlogPostSelect;

function toBlogPostCard(row: Prisma.BlogPostGetPayload<{ select: typeof BLOG_CARD_SELECT }>): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    authorName: row.authorName,
    authorAvatarUrl: row.authorAvatarUrl ?? undefined,
    categoryId: row.categoryId ?? undefined,
    topicId: row.topicId ?? undefined,
    body: "",
    readingMinutes: row.readingMinutes,
    publishedAt: row.publishedAt.toISOString(),
    seo: row.seo as unknown as BlogSeo,
    isFeatured: row.isFeatured,
    isFirst: row.isFirst,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export const getBlogPostCards = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const rows = await prisma.blogPost.findMany({
      where: { isActive: true },
      select: BLOG_CARD_SELECT,
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toBlogPostCard);
  },
  ["blog:active:cards"],
  { tags: ["blog:list"], revalidate: 300 }
);

export const getFeaturedBlogPosts = unstable_cache(
  async (limit = 3): Promise<BlogPost[]> => {
    const rows = await prisma.blogPost.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toBlogPost);
  },
  ["blog:featured"],
  { tags: ["blog:list"], revalidate: 300 }
);

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.blogPost.findUnique({ where: { slug } });
      if (!row || !row.isActive) return undefined;
      return toBlogPost(row);
    },
    [`blog:${slug}`],
    { tags: [`blog:${slug}`], revalidate: 300 }
  )();
}

export async function getRelatedBlogPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  if (!post.topicId) return [];
  const rows = await prisma.blogPost.findMany({
    where: { isActive: true, id: { not: post.id }, topicId: post.topicId },
    select: BLOG_CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map(toBlogPostCard);
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  const row = await prisma.blogPost.findUnique({ where: { id } });
  return row ? toBlogPost(row) : undefined;
}

export async function setBlogPostFeatured(id: string, isFeatured: boolean): Promise<BlogPost> {
  const row = await prisma.blogPost.update({
    where: { id },
    data: { isFeatured },
  });
  purgeTag("blog:list");
  purgeTag(`blog:${row.slug}`);
  return toBlogPost(row);
}

export async function setBlogPostFirst(id: string, isFirst: boolean): Promise<BlogPost> {
  const row = await prisma.blogPost.update({
    where: { id },
    data: { isFirst },
  });
  purgeTag("blog:list");
  purgeTag(`blog:${row.slug}`);
  return toBlogPost(row);
}

export async function setBlogPostActive(id: string, isActive: boolean): Promise<BlogPost> {
  const row = await prisma.blogPost.update({
    where: { id },
    data: { isActive },
  });
  purgeTag("blog:list");
  purgeTag(`blog:${row.slug}`);
  return toBlogPost(row);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const row = await prisma.blogPost.delete({ where: { id } });
  purgeTag("blog:list");
  purgeTag(`blog:${row.slug}`);
}

export interface AdminBlogPostFields {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  categoryId?: string | null;
  topicId?: string | null;
  body: string;
  readingMinutes: number;
  publishedAt: Date;
  isFeatured: boolean;
  isFirst: boolean;
  seo: BlogSeo;
}

export async function createBlogPost(fields: AdminBlogPostFields): Promise<BlogPost> {
  const row = await prisma.blogPost.create({
    data: {
      id: crypto.randomUUID(),
      slug: fields.slug,
      title: fields.title,
      excerpt: fields.excerpt,
      coverImage: fields.coverImage,
      authorName: fields.authorName,
      authorAvatarUrl: fields.authorAvatarUrl || null,
      categoryId: fields.categoryId || null,
      topicId: fields.topicId || null,
      body: fields.body,
      readingMinutes: fields.readingMinutes,
      publishedAt: fields.publishedAt,
      isFeatured: fields.isFeatured,
      isFirst: fields.isFirst,
      seo: fields.seo as unknown as Prisma.InputJsonValue,
    },
  });
  purgeTag("blog:list");
  return toBlogPost(row);
}

export async function updateBlogPost(id: string, fields: AdminBlogPostFields): Promise<BlogPost> {
  const row = await prisma.blogPost.update({
    where: { id },
    data: {
      slug: fields.slug,
      title: fields.title,
      excerpt: fields.excerpt,
      coverImage: fields.coverImage,
      authorName: fields.authorName,
      authorAvatarUrl: fields.authorAvatarUrl || null,
      categoryId: fields.categoryId || null,
      topicId: fields.topicId || null,
      body: fields.body,
      readingMinutes: fields.readingMinutes,
      publishedAt: fields.publishedAt,
      isFeatured: fields.isFeatured,
      isFirst: fields.isFirst,
      seo: fields.seo as unknown as Prisma.InputJsonValue,
    },
  });
  purgeTag("blog:list");
  purgeTag(`blog:${row.slug}`);
  return toBlogPost(row);
}
