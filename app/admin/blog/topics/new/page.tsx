import { BlogTopicForm } from "@/components/admin/BlogTopicForm";

export default function NewBlogTopicPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New topic</h1>
      <div className="mt-6">
        <BlogTopicForm />
      </div>
    </div>
  );
}
