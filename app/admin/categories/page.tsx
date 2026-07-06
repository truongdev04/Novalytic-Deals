import Link from "next/link";
import { Plus } from "lucide-react";
import { getCategories } from "@/lib/data";
import { CategoryTable } from "@/components/admin/CategoryTable";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Categories</h1>
          <p className="mt-1 text-sm text-muted-500">{categories.length} categories.</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      <div className="mt-6">
        <CategoryTable categories={categories} />
      </div>
    </div>
  );
}
