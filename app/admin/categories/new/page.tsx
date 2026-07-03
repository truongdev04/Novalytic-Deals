import { getCategories } from "@/lib/data";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function NewCategoryPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New category</h1>
      <div className="mt-6">
        <CategoryForm categories={categories} />
      </div>
    </div>
  );
}
