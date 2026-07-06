import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type { BlogTopic } from "@/types";
import type { BlogTopic as PrismaBlogTopic } from "@prisma/client";

function toBlogTopic(row: PrismaBlogTopic): BlogTopic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export const getBlogTopics = unstable_cache(
  async (): Promise<BlogTopic[]> => {
    const rows = await prisma.blogTopic.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toBlogTopic);
  },
  ["blog-topics:list"],
  { tags: ["blog-topics:list"], revalidate: 300 }
);

export async function getBlogTopicBySlug(slug: string): Promise<BlogTopic | undefined> {
  return unstable_cache(
    async () => {
      const row = await prisma.blogTopic.findUnique({ where: { slug } });
      return row ? toBlogTopic(row) : undefined;
    },
    [`blog-topic:${slug}`],
    { tags: [`blog-topic:${slug}`], revalidate: 300 }
  )();
}

export async function getBlogTopicById(id: string): Promise<BlogTopic | undefined> {
  const all = await getBlogTopics();
  return all.find((t) => t.id === id);
}

export interface AdminBlogTopicFields {
  slug: string;
  name: string;
  description?: string | null;
}

function throwIfSlugConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes("slug")
  ) {
    throw new Error("SLUG_TAKEN");
  }
  throw error;
}

export async function createBlogTopic(fields: AdminBlogTopicFields): Promise<BlogTopic> {
  try {
    const row = await prisma.blogTopic.create({
      data: {
        id: crypto.randomUUID(),
        slug: fields.slug,
        name: fields.name,
        description: fields.description || null,
      },
    });
    purgeTag("blog-topics:list");
    return toBlogTopic(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}

export async function updateBlogTopic(
  id: string,
  fields: AdminBlogTopicFields
): Promise<BlogTopic> {
  try {
    const row = await prisma.blogTopic.update({
      where: { id },
      data: {
        slug: fields.slug,
        name: fields.name,
        description: fields.description || null,
      },
    });
    purgeTag("blog-topics:list");
    purgeTag(`blog-topic:${row.slug}`);
    return toBlogTopic(row);
  } catch (error) {
    throwIfSlugConflict(error);
  }
}

export async function deleteBlogTopic(id: string): Promise<void> {
  const postCount = await prisma.blogPost.count({ where: { topicId: id } });
  if (postCount > 0) {
    throw new Error("TOPIC_IN_USE");
  }

  const row = await prisma.blogTopic.delete({ where: { id } });
  purgeTag("blog-topics:list");
  purgeTag(`blog-topic:${row.slug}`);
}
