import { notFound } from "next/navigation";
import { getCategories, getCategoryById } from "@/lib/data";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([getCategoryById(id), getCategories()]);
  if (!category) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit category</h1>
      <div className="mt-6">
        <CategoryForm category={category} categories={categories} />
      </div>
    </div>
  );
}
