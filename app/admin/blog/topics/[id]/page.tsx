import { notFound } from "next/navigation";
import { getBlogTopicById } from "@/lib/data";
import { BlogTopicForm } from "@/components/admin/BlogTopicForm";

export default async function EditBlogTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topic = await getBlogTopicById(id);
  if (!topic) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit topic</h1>
      <div className="mt-6">
        <BlogTopicForm topic={topic} />
      </div>
    </div>
  );
}
