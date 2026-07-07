import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllBlogPosts } from "@/lib/data";
import { BlogTable } from "@/components/admin/BlogTable";

export default async function AdminBlogPage() {
  const posts = await getAllBlogPosts();
  // Public pages want getBlogPosts()'s publish-date order; the admin list
  // wants newest-created posts first instead, so re-sort a copy here rather
  // than changing the shared cached order.
  const postsForAdmin = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Blog</h1>
          <p className="mt-1 text-sm text-muted-500">{posts.length} posts.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Post
        </Link>
      </div>

      <div className="mt-6">
        <BlogTable posts={postsForAdmin} />
      </div>
    </div>
  );
}
