import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { getAuthors } from "@/lib/data";
import { AuthorTable } from "@/components/admin/AuthorTable";

export default async function AdminAuthorSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Author</h1>
        <p className="mt-4 text-sm text-muted-500">
          Only admins can view and edit author settings.
        </p>
      </div>
    );
  }

  const authors = await getAuthors();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Author</h1>
          <p className="mt-1 text-sm text-muted-500">
            Authors used for blog posts. The default author prefills new posts.
          </p>
        </div>
        <Link
          href="/admin/settings/author/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Author
        </Link>
      </div>

      <div className="mt-6">
        <AuthorTable authors={authors} />
      </div>
    </div>
  );
}
