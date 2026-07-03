"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { adminCategorySchema, type AdminCategoryInput } from "@/lib/validators/admin/category";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { Category } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function CategoryForm({
  category,
  categories,
}: {
  category?: Category;
  categories: Category[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminCategoryInput>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues: category
      ? {
          slug: category.slug,
          name: category.name,
          description: category.description,
          iconName: category.iconName,
          parentId: category.parentId ?? "",
          isFeatured: category.isFeatured,
          seoTitle: category.seo.title,
          seoDescription: category.seo.description,
        }
      : { isFeatured: false },
  });

  async function onSubmit(data: AdminCategoryInput) {
    try {
      const endpoint = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories";
      const res = await fetch(endpoint, {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(category ? "Category updated." : "Category created.");
      router.push("/admin/categories");
      router.refresh();
    } catch {
      toast.error("Failed to save category.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-950">
          Name
        </label>
        <input id="name" className={fieldClassName} {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
          Slug
        </label>
        <input id="slug" className={fieldClassName} {...register("slug")} />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
          Description
        </label>
        <textarea id="description" rows={3} className={fieldClassName} {...register("description")} />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="iconName" className="mb-1.5 block text-sm font-medium text-brand-950">
          Icon name <span className="text-muted-400">(lucide-react icon name)</span>
        </label>
        <input id="iconName" className={fieldClassName} {...register("iconName")} />
        {errors.iconName && <p className="mt-1 text-xs text-red-600">{errors.iconName.message}</p>}
      </div>

      <div>
        <label htmlFor="parentId" className="mb-1.5 block text-sm font-medium text-brand-950">
          Parent category <span className="text-muted-400">(optional)</span>
        </label>
        <select id="parentId" className={fieldClassName} {...register("parentId")}>
          <option value="">None</option>
          {categories
            .filter((c) => c.id !== category?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label htmlFor="seoTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
          SEO title
        </label>
        <input id="seoTitle" className={fieldClassName} {...register("seoTitle")} />
        {errors.seoTitle && <p className="mt-1 text-xs text-red-600">{errors.seoTitle.message}</p>}
      </div>

      <div>
        <label htmlFor="seoDescription" className="mb-1.5 block text-sm font-medium text-brand-950">
          SEO description
        </label>
        <textarea
          id="seoDescription"
          rows={2}
          className={fieldClassName}
          {...register("seoDescription")}
        />
        {errors.seoDescription && (
          <p className="mt-1 text-xs text-red-600">{errors.seoDescription.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
        <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
        Featured
      </label>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : category ? "Update category" : "Create category"}
      </Button>
    </form>
  );
}
