import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCategories, getCategoryById, getCategoryOwnerId } from "@/lib/data";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { isDataScoped } from "@/lib/permissions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const scoped = isDataScoped(session?.user?.role, session?.user?.fullDataAccess, "categories");
  const [category, ownerId, categories] = await Promise.all([
    getCategoryById(id),
    scoped ? getCategoryOwnerId(id) : Promise.resolve(undefined),
    getCategories(),
  ]);
  if (!category) notFound();
  if (scoped && ownerId !== session?.user?.id) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit category</h1>
      <div className="mt-6">
        <CategoryForm category={category} categories={categories} />
      </div>
    </div>
  );
}
