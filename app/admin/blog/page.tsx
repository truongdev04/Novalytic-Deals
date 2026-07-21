import Link from "next/link";
import { Plus } from "lucide-react";
import { getBlogPostsAdminPaginated, type AdminBlogFilters } from "@/lib/data";
import { BlogTable } from "@/components/admin/BlogTable";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";

function parseBool(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    featured?: string;
    first?: string;
    status?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const filters: AdminBlogFilters = {
    query: params.q || undefined,
    isFeatured: parseBool(params.featured),
    isFirst: parseBool(params.first),
    isActive: params.status === "active" ? true : params.status === "hidden" ? false : undefined,
  };

  const { items: posts, total } = await getBlogPostsAdminPaginated(filters, page, pageSize);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Blog</h1>
          <p className="mt-1 text-sm text-muted-500">{total} posts.</p>
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
        <BlogTable posts={posts} total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
