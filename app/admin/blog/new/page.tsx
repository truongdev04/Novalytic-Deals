import { getBlogTopics, getCategories } from "@/lib/data";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function NewBlogPostPage() {
  const [categories, topics] = await Promise.all([getCategories(), getBlogTopics()]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New blog post</h1>
      <div className="mt-6">
        <BlogForm categories={categories} topics={topics} />
      </div>
    </div>
  );
}
