import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getAuthors,
  getBlogPostById,
  getBlogPostOwnerId,
  getBlogTopics,
  getCategories,
  getContentConfigSettings,
} from "@/lib/data";
import { BlogForm } from "@/components/admin/BlogForm";
import { isDataScoped } from "@/lib/permissions";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const scoped = isDataScoped(session?.user?.role, session?.user?.fullDataAccess, "blog");
  const [post, ownerId, categories, topics, authors, contentConfig] = await Promise.all([
    getBlogPostById(id),
    scoped ? getBlogPostOwnerId(id) : Promise.resolve(undefined),
    getCategories(),
    getBlogTopics(),
    getAuthors(),
    getContentConfigSettings(),
  ]);
  if (!post) notFound();
  if (scoped && ownerId !== session?.user?.id) notFound();

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
