import { notFound } from "next/navigation";
import {
  getAuthors,
  getBlogPostById,
  getBlogTopics,
  getCategories,
  getContentConfigSettings,
} from "@/lib/data";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, topics, authors, contentConfig] = await Promise.all([
    getBlogPostById(id),
    getCategories(),
    getBlogTopics(),
    getAuthors(),
    getContentConfigSettings(),
  ]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit blog post</h1>
      <div className="mt-6">
        <BlogForm
          post={post}
          categories={categories}
          topics={topics}
          authors={authors}
          templates={contentConfig.templates}
        />
      </div>
    </div>
  );
}
