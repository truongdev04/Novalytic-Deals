import Link from "next/link";
import { Plus } from "lucide-react";
import { getBlogTopics } from "@/lib/data";
import { BlogTopicTable } from "@/components/admin/BlogTopicTable";

export default async function AdminBlogTopicsPage() {
  const topics = await getBlogTopics();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Blog Topics</h1>
          <p className="mt-1 text-sm text-muted-500">{topics.length} topics.</p>
        </div>
        <Link
          href="/admin/blog/topics/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Topic
        </Link>
      </div>

      <div className="mt-6">
        <BlogTopicTable topics={topics} />
      </div>
    </div>
  );
}
