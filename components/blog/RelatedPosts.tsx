import { SectionHeader } from "@/components/layout/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

export function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Related articles" align="left" />
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
