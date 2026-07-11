import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAuthorById } from "@/lib/data";
import { AuthorForm } from "@/components/admin/AuthorForm";

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Edit Author</h1>
        <p className="mt-4 text-sm text-muted-500">Only admins can edit author settings.</p>
      </div>
    );
  }

  const { id } = await params;
  const author = await getAuthorById(id);
  if (!author) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit {author.name}</h1>
      <div className="mt-6">
        <AuthorForm author={author} />
      </div>
    </div>
  );
}
