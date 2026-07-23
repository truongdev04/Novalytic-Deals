"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft } from "lucide-react";
import { adminCategorySchema, type AdminCategoryInput } from "@/lib/validators/admin/category";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ScrollableSingleSelectDropdown } from "@/components/admin/ScrollableSingleSelectDropdown";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/utils";
import { iconMap, renderCategoryIcon } from "@/lib/icons";
import type { Category } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function CategoryForm({
  category,
  categories,
}: {
  category?: Category;
  categories: Category[];
}) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [pendingIconProvider, setPendingIconProvider] = useState<StorageProvider>("cloudinary");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminCategoryInput>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues: category
      ? {
          slug: category.slug,
          name: category.name,
          description: category.description,
          iconName: category.iconName ?? "",
          iconImageUrl: category.iconImageUrl ?? "",
          parentId: category.parentId ?? "",
          isFeatured: category.isFeatured,
          seoTitle: category.seo.title,
          seoDescription: category.seo.description,
        }
      : { isFeatured: false, iconName: "", iconImageUrl: "" },
  });

  const parentOptions = [
    { value: "", label: "None" },
    ...categories
      .filter((c) => c.id !== category?.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ value: c.id, label: c.name })),
  ];

  const iconOptions = [
    { value: "", label: "None" },
    ...Object.keys(iconMap).map((name) => ({ value: name, label: name })),
  ];

  const previewName = useWatch({ control, name: "name" }) || "Category";
  const previewIconName = useWatch({ control, name: "iconName" });
  const previewIconImageUrl = useWatch({ control, name: "iconImageUrl" });

  async function onSubmit(data: AdminCategoryInput) {
    try {
      let iconImageUrl = data.iconImageUrl;
      if (pendingIconFile) {
        const formData = new FormData();
        formData.append("file", pendingIconFile);
        formData.append("provider", pendingIconProvider);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const uploadBody = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok || !uploadBody?.data?.url) {
          toast.error(uploadBody?.error || "Failed to upload icon image.");
          return;
        }
        iconImageUrl = uploadBody.data.url;
      }

      const endpoint = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories";
      const res = await fetch(endpoint, {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, iconImageUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to save category.";
        if (message.toLowerCase().includes("slug")) {
          setError("slug", { message });
        }
        toast.error(message);
        return;
      }
      toast.success(category ? "Category updated." : "Category created.");
      router.push("/admin/categories");
      router.refresh();
    } catch {
      toast.error("Failed to save category.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/categories");
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-600 hover:bg-surface-100 hover:text-brand-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mx-auto mt-6 w-full space-y-5 md:w-4/5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-950">
                Name{requiredMark()}
              </label>
              <input
                id="name"
                className={fieldClassName}
                {...register("name", {
                  onChange: (e) => {
                    if (!category) {
                      setValue("slug", slugify(e.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
                Slug{requiredMark()}
              </label>
              <input id="slug" className={fieldClassName} {...register("slug")} />
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description{requiredMark()}
            </label>
            <textarea id="description" rows={3} className={fieldClassName} {...register("description")} />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Icon name <span className="text-muted-400">(optional, lucide-react)</span>
              </span>
              <Controller
                control={control}
                name="iconName"
                render={({ field }) => (
                  <ScrollableSingleSelectDropdown
                    options={iconOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    searchable
                    searchPlaceholder="Search icons..."
                  />
                )}
              />
              {errors.iconName && (
                <p className="mt-1 text-xs text-red-600">{errors.iconName.message}</p>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Parent category <span className="text-muted-400">(optional)</span>
              </span>
              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <ScrollableSingleSelectDropdown
                    options={parentOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    searchable
                    searchPlaceholder="Search categories..."
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Controller
              control={control}
              name="iconImageUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Icon image"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  aspectClassName="aspect-square w-20"
                  error={errors.iconImageUrl?.message}
                  deferUpload
                  onFileSelected={(file, provider) => {
                    setPendingIconFile(file);
                    setPendingIconProvider(provider);
                  }}
                />
              )}
            />

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-muted-500">Preview</span>
              <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-muted-200 bg-brand-50 text-brand-600">
                {renderCategoryIcon(
                  { name: previewName, iconName: previewIconName, iconImageUrl: previewIconImageUrl },
                  { iconClassName: "h-5 w-5" }
                )}
              </span>
              {previewIconName && previewIconImageUrl && (
                <span className="max-w-[10rem] text-center text-[11px] text-muted-400">
                  Icon name được ưu tiên hiển thị
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="seoTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
              SEO title{requiredMark()}
            </label>
            <input id="seoTitle" className={fieldClassName} {...register("seoTitle")} />
            {errors.seoTitle && <p className="mt-1 text-xs text-red-600">{errors.seoTitle.message}</p>}
          </div>

          <div>
            <label htmlFor="seoDescription" className="mb-1.5 block text-sm font-medium text-brand-950">
              SEO description{requiredMark()}
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

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
              <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
              Featured
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : category ? "Update category" : "Create category"}
            </Button>
          </div>
        </div>
      </form>

      <Modal
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Discard unsaved changes?"
      >
        <p className="text-sm text-muted-600">
          You have unsaved changes. If you leave now, they will be lost.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
            Keep editing
          </Button>
          <Button variant="primary" onClick={() => router.push("/admin/categories")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
