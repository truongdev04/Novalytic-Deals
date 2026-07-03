import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { BlogAuthor, BlogPost, BlogSeo } from "@/types";
import type { BlogPost as PrismaBlogPost, BlogAuthor as PrismaBlogAuthor } from "@prisma/client";

type BlogPostRow = PrismaBlogPost & { author: PrismaBlogAuthor };

function toBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    author: {
      id: row.author.id,
      name: row.author.name,
      avatarUrl: row.author.avatarUrl ?? undefined,
    },
    tags: row.tags,
    categoryId: row.categoryId ?? undefined,
    body: row.body,
    readingMinutes: row.readingMinutes,
    publishedAt: row.publishedAt.toISOString(),
    seo: row.seo as unknown as BlogSeo,
    isFeatured: row.isFeatured,
  };
}

export const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const rows = await prisma.blogPost.findMany({ include: { author: true } });
    return rows
      .map(toBlogPost)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },
  ["blog:list"],
  { tags: ["blog:list"], revalidate: 300 }
);

export const getFeaturedBlogPosts = unstable_cache(
  async (limit = 3): Promise<BlogPost[]> => {
    const all = await getBlogPosts();
    return all.filter((p) => p.isFeatured).slice(0, limit);
  },
  ["blog:featured"],
  { tags: ["blog:list"], revalidate: 300 }
);

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.blogPost.findUnique({
        where: { slug },
        include: { author: true },
      });
      return row ? toBlogPost(row) : undefined;
    },
    [`blog:${slug}`],
    { tags: [`blog:${slug}`], revalidate: 300 }
  )();
}

export async function getRelatedBlogPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const all = await getBlogPosts();
  return all
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, limit);
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  const row = await prisma.blogPost.findUnique({ where: { id }, include: { author: true } });
  return row ? toBlogPost(row) : undefined;
}

export async function getBlogAuthors(): Promise<BlogAuthor[]> {
  const rows = await prisma.blogAuthor.findMany({ orderBy: { name: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl ?? undefined,
  }));
}

export async function setBlogPostFeatured(id: string, isFeatured: boolean): Promise<BlogPost> {
  const row = await prisma.blogPost.update({
    where: { id },
    data: { isFeatured },
    include: { author: true },
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
  authorId: string;
  tags: string[];
  categoryId?: string | null;
  body: string;
  readingMinutes: number;
  publishedAt: Date;
  isFeatured: boolean;
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
      authorId: fields.authorId,
      tags: fields.tags,
      categoryId: fields.categoryId || null,
      body: fields.body,
      readingMinutes: fields.readingMinutes,
      publishedAt: fields.publishedAt,
      isFeatured: fields.isFeatured,
      seo: fields.seo as unknown as Prisma.InputJsonValue,
    },
    include: { author: true },
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
      authorId: fields.authorId,
      tags: fields.tags,
      categoryId: fields.categoryId || null,
      body: fields.body,
      readingMinutes: fields.readingMinutes,
      publishedAt: fields.publishedAt,
      isFeatured: fields.isFeatured,
      seo: fields.seo as unknown as Prisma.InputJsonValue,
    },
    include: { author: true },
  });
  purgeTag("blog:list");
  purgeTag(`blog:${row.slug}`);
  return toBlogPost(row);
}
