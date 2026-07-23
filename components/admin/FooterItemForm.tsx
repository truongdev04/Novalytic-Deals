"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { resolveRichTextImages } from "@/lib/richTextImageUpload";
import { slugify } from "@/lib/utils";
import {
  adminFooterSettingsSchema,
  type AdminFooterSettingsInput,
} from "@/lib/validators/admin/settings";
import type { FooterColumnType, FooterItem, FooterSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

type Item = AdminFooterSettingsInput["columns"][number]["items"][number];

function emptyItemForType(type: FooterColumnType): Item {
  const base = { itemId: crypto.randomUUID(), name: "", isVisible: true };
  if (type === "PATH") return { ...base, path: "" };
  if (type === "LINK") return { ...base, link: "" };
  return { ...base, title: "", slug: "", description: "" };
}

export function FooterItemForm({
  settings,
  columnIndex,
  type,
  item,
}: {
  settings: FooterSettings;
  columnIndex: number;
  type: FooterColumnType;
  item?: FooterItem;
}) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [initial] = useState(() => {
    const items = settings.columns[columnIndex].items;
    if (item) {
      const itemIndex = items.findIndex((i) => i.itemId === item.itemId);
      return { itemIndex, columns: settings.columns };
    }
    const itemIndex = items.length;
    const columns = settings.columns.map((column, ci) =>
      ci === columnIndex ? { ...column, items: [...column.items, emptyItemForType(type)] } : column
    );
    return { itemIndex, columns };
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminFooterSettingsInput>({
    resolver: zodResolver(adminFooterSettingsSchema),
    defaultValues: { columns: initial.columns },
  });

  const namePrefix = `columns.${columnIndex}.items.${initial.itemIndex}` as const;
  const slugValue = useWatch({ control, name: `${namePrefix}.slug` as const });
  const itemErrors = errors.columns?.[columnIndex]?.items?.[initial.itemIndex];

  async function onSubmit(data: AdminFooterSettingsInput) {
    try {
      const columns = await Promise.all(
        data.columns.map(async (column, ci) => {
          if (ci !== columnIndex || column.type !== "PAGE") return column;
          const items = await Promise.all(
            column.items.map(async (currentItem, ii) => {
              if (ii !== initial.itemIndex) return currentItem;
              return {
                ...currentItem,
                description: currentItem.description
                  ? await resolveRichTextImages(currentItem.description)
                  : currentItem.description,
              };
            })
          );
          return { ...column, items };
        })
      );

      const res = await fetch("/api/admin/settings/footer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(item ? "Item updated." : "Item created.");
      router.push("/admin/settings/footer");
      router.refresh();
    } catch {
      toast.error("Failed to save item.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/settings/footer");
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Name</label>
            <input
              className={fieldClassName}
              {...register(`${namePrefix}.name` as const, {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!item && type === "PAGE") {
                    setValue(`${namePrefix}.slug` as const, slugify(e.target.value), {
                      shouldDirty: true,
                    });
                  }
                },
              })}
            />
            {itemErrors?.name && <p className="mt-1 text-xs text-red-600">{itemErrors.name.message}</p>}
          </div>

          {type === "PATH" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-950">Path</label>
              <input
                placeholder="/valentine"
                className={fieldClassName}
                {...register(`${namePrefix}.path` as const)}
              />
              {itemErrors?.path && <p className="mt-1 text-xs text-red-600">{itemErrors.path.message}</p>}
            </div>
          )}

          {type === "LINK" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-950">Link</label>
              <input
                placeholder="https://..."
                className={fieldClassName}
                {...register(`${namePrefix}.link` as const)}
              />
              {itemErrors?.link && <p className="mt-1 text-xs text-red-600">{itemErrors.link.message}</p>}
            </div>
          )}

          {type === "PAGE" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-950">Title</label>
                <input className={fieldClassName} {...register(`${namePrefix}.title` as const)} />
                {itemErrors?.title && <p className="mt-1 text-xs text-red-600">{itemErrors.title.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-950">Slug</label>
                <input className={fieldClassName} {...register(`${namePrefix}.slug` as const)} />
                {itemErrors?.slug && <p className="mt-1 text-xs text-red-600">{itemErrors.slug.message}</p>}
                <p className="mt-1 text-xs text-muted-500">Served at /{slugValue || "your-slug"}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-950">Description</label>
                <Controller
                  control={control}
                  name={`${namePrefix}.description` as const}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      minHeightClassName="min-h-64"
                      maxHeightClassName="max-h-[32rem]"
                    />
                  )}
                />
                {itemErrors?.description && (
                  <p className="mt-1 text-xs text-red-600">{itemErrors.description.message}</p>
                )}
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register(`${namePrefix}.isVisible` as const)} />
            Visible in footer
          </label>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : item ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </div>
      </form>

      <Modal open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm} title="Discard unsaved changes?">
        <p className="text-sm text-muted-600">
          You have unsaved changes. If you leave now, they will be lost.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
            Keep editing
          </Button>
          <Button variant="primary" onClick={() => router.push("/admin/settings/footer")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
