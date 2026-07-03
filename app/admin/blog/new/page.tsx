import { getBlogAuthors, getCategories } from "@/lib/data";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function NewBlogPostPage() {
  const [authors, categories] = await Promise.all([getBlogAuthors(), getCategories()]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New blog post</h1>
      <div className="mt-6">
        <BlogForm authors={authors} categories={categories} />
      </div>
    </div>
  );
}
