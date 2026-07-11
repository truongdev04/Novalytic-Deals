import { getAuthors, getBlogTopics, getCategories, getContentConfigSettings } from "@/lib/data";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function NewBlogPostPage() {
  const [categories, topics, authors, contentConfig] = await Promise.all([
    getCategories(),
    getBlogTopics(),
    getAuthors(),
    getContentConfigSettings(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New blog post</h1>
      <div className="mt-6">
        <BlogForm
          categories={categories}
          topics={topics}
          authors={authors}
          templates={contentConfig.templates}
        />
      </div>
    </div>
  );
}
