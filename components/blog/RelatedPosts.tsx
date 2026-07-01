import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

export function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold text-brand-950">
        Related articles
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
