import { auth } from "@/auth";
import { AuthorForm } from "@/components/admin/AuthorForm";

export default async function NewAuthorPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Add Author</h1>
        <p className="mt-4 text-sm text-muted-500">Only admins can edit author settings.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Add Author</h1>
      <div className="mt-6">
        <AuthorForm />
      </div>
    </div>
  );
}
