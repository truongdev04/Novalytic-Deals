import { unstable_cache } from "next/cache";
import blogData from "@/data/blog.json";
import type { BlogPost } from "@/types";

const allPosts = blogData as BlogPost[];

export const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[]> =>
    [...allPosts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ),
  ["blog:list"],
  { tags: ["blog:list"], revalidate: 300 }
);

export const getFeaturedBlogPosts = unstable_cache(
  async (limit = 3): Promise<BlogPost[]> =>
    allPosts.filter((p) => p.isFeatured).slice(0, limit),
  ["blog:featured"],
  { tags: ["blog:list"], revalidate: 300 }
);

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return unstable_cache(
    async () => allPosts.find((p) => p.slug === slug),
    [`blog:${slug}`],
    { tags: [`blog:${slug}`], revalidate: 300 }
  )();
}

export async function getRelatedBlogPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  return allPosts
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, limit);
}
