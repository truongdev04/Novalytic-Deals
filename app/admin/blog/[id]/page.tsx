import { notFound } from "next/navigation";
import { getBlogAuthors, getBlogPostById, getCategories } from "@/lib/data";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, authors, categories] = await Promise.all([
    getBlogPostById(id),
    getBlogAuthors(),
    getCategories(),
  ]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit blog post</h1>
      <div className="mt-6">
        <BlogForm post={post} authors={authors} categories={categories} />
      </div>
    </div>
  );
}
