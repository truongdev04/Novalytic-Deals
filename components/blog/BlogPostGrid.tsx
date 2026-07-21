"use client";

import { useState } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogPost } from "@/types";

const COLUMNS = 3;
const ROWS_PER_PAGE = 5;
const PAGE_SIZE = COLUMNS * ROWS_PER_PAGE;

export function BlogPostGrid({ posts }: { posts: BlogPost[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-xl border border-muted-300 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface-100"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
