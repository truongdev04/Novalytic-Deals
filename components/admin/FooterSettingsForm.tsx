"use client";

import { useState } from "react";
import {
  Controller,
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import {
  adminFooterSettingsSchema,
  type AdminFooterSettingsInput,
} from "@/lib/validators/admin/settings";
import type { FooterColumnType, FooterSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const MAX_COLUMNS = 4;

const TYPE_OPTIONS: { value: FooterColumnType; label: string }[] = [
  { value: "PAGE", label: "Page" },
  { value: "PATH", label: "Path" },
  { value: "LINK", label: "Link" },
];

const ADD_ITEM_LABEL: Record<FooterColumnType, string> = {
  PAGE: "Add Page",
  PATH: "Add Path",
  LINK: "Add Link",
};

const TYPE_BADGE_VARIANT: Record<FooterColumnType, "brand" | "accent" | "muted"> = {
  PAGE: "accent",
  PATH: "brand",
  LINK: "muted",
};

type Column = AdminFooterSettingsInput["columns"][number];

function draftColumn(): Column {
  return { title: "", type: "" as unknown as FooterColumnType, isVisible: true, items: [] };
}

function itemPreview(type: FooterColumnType, item: { path?: string; link?: string; slug?: string }) {
  if (type === "PATH") return item.path || "—";
  if (type === "LINK") return item.link || "—";
  return item.slug ? `/${item.slug}` : "—";
}

function FooterColumnFields({
  control,
  register,
  errors,
  columnIndex,
  isPersisted,
  onRemoveColumn,
}: {
  control: Control<AdminFooterSettingsInput>;
  register: UseFormRegister<AdminFooterSettingsInput>;
  errors: FieldErrors<AdminFooterSettingsInput>;
  columnIndex: number;
  isPersisted: boolean;
  onRemoveColumn: () => void;
}) {
  const itemsArray = useFieldArray({ control, name: `columns.${columnIndex}.items` });
  const type = useWatch({ control, name: `columns.${columnIndex}.type` });
  const title = useWatch({ control, name: `columns.${columnIndex}.title` });
  const isVisible = useWatch({ control, name: `columns.${columnIndex}.isVisible` });
  const watchedItems = useWatch({ control, name: `columns.${columnIndex}.items` }) ?? [];
  const isTypeChosen = type === "PAGE" || type === "PATH" || type === "LINK";
  const columnErrors = errors.columns?.[columnIndex];

  return (
    <Accordion.Item
      value={String(columnIndex)}
      className="overflow-hidden rounded-lg border border-muted-200"
    >
      <div className="flex items-center justify-between gap-2 bg-surface-0 px-4 py-3">
        <Accordion.Header className="min-w-0 flex-1">
          <Accordion.Trigger className="group flex w-full items-center gap-3 text-left focus-visible:outline-none">
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-500 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
            <span className="truncate font-medium text-brand-950">{title || "Untitled column"}</span>
            {isTypeChosen && <Badge variant={TYPE_BADGE_VARIANT[type as FooterColumnType]}>{type}</Badge>}
            <span className="shrink-0 text-xs text-muted-500">{itemsArray.fields.length} items</span>
            {!isVisible && <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-400" />}
          </Accordion.Trigger>
        </Accordion.Header>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveColumn();
          }}
          aria-label="Remove column"
          className="shrink-0 rounded-lg p-1.5 text-muted-500 hover:bg-surface-100 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Accordion.Content className="space-y-4 border-t border-muted-200 bg-surface-0 p-4 data-[state=open]:animate-fade-in">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Name Column</label>
            <input
              className={fieldClassName}
              placeholder="e.g. Notices"
              {...register(`columns.${columnIndex}.title` as const)}
            />
            {columnErrors?.title && <p className="mt-1 text-xs text-red-600">{columnErrors.title.message}</p>}
          </div>
          <div className="w-40">
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Type</label>
            <Controller
              control={control}
              name={`columns.${columnIndex}.type` as const}
              render={({ field }) => (
                <SingleSelectDropdown
                  options={TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select type"
                  disabled={isTypeChosen}
                />
              )}
            />
            {columnErrors?.type && <p className="mt-1 text-xs text-red-600">Select a type</p>}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-600">
          <input type="checkbox" className="h-4 w-4" {...register(`columns.${columnIndex}.isVisible` as const)} />
          Visible in footer
        </label>

        {isTypeChosen ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-brand-950">Items</span>
              {isPersisted ? (
                <Link
                  href={`/admin/settings/footer/items/new?columnIndex=${columnIndex}`}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {ADD_ITEM_LABEL[type as FooterColumnType]}
                </Link>
              ) : (
                <span className="text-xs text-muted-400">Save this column first to add items</span>
              )}
            </div>
            <div className="divide-y divide-muted-200 rounded-lg border border-muted-200">
              {itemsArray.fields.map((field, itemIndex) => {
                const liveItem = watchedItems[itemIndex];
                if (!liveItem) return null;
                return (
                  <div key={field.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-brand-950">{liveItem.name || "Untitled item"}</p>
                      <p className="truncate text-xs text-muted-500">
                        {itemPreview(type as FooterColumnType, liveItem)}
                      </p>
                    </div>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        {...register(`columns.${columnIndex}.items.${itemIndex}.isVisible` as const)}
                      />
                      Visible
                    </label>
                    {isPersisted ? (
                      <Link
                        href={`/admin/settings/footer/items/${liveItem.itemId}`}
                        aria-label={`Edit ${liveItem.name || "item"}`}
                        className="shrink-0 rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="shrink-0 p-1.5 text-muted-300">
                        <Pencil className="h-4 w-4" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => itemsArray.remove(itemIndex)}
                      aria-label="Remove item"
                      className="shrink-0 rounded-lg p-1.5 text-muted-500 hover:bg-surface-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {itemsArray.fields.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-muted-500">No items yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-500">Select a type to start adding items.</p>
        )}
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function FooterSettingsForm({ settings }: { settings: FooterSettings }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdminFooterSettingsInput>({
    resolver: zodResolver(adminFooterSettingsSchema),
    defaultValues: { columns: settings.columns },
  });

  const columnsArray = useFieldArray({ control, name: "columns" });
  const [openColumns, setOpenColumns] = useState<string[]>([]);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const savedColumnsCount = settings.columns.length;
  const pendingDeleteTitle = useWatch({
    control,
    name: pendingDeleteIndex !== null ? (`columns.${pendingDeleteIndex}.title` as const) : "columns.0.title",
  });

  function handleAddColumn() {
    const newIndex = columnsArray.fields.length;
    columnsArray.append(draftColumn());
    setOpenColumns((prev) => [...prev, String(newIndex)]);
  }

  function handleRemoveColumn(index: number) {
    columnsArray.remove(index);
    setOpenColumns((prev) =>
      prev
        .filter((value) => value !== String(index))
        .map((value) => (Number(value) > index ? String(Number(value) - 1) : value))
    );
  }

  function confirmRemoveColumn() {
    if (pendingDeleteIndex === null) return;
    handleRemoveColumn(pendingDeleteIndex);
    setPendingDeleteIndex(null);
  }

  async function onSubmit(data: AdminFooterSettingsInput) {
    try {
      const res = await fetch("/api/admin/settings/footer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Footer settings saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full space-y-5 md:w-4/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-950">Footer columns</span>
        <button
          type="button"
          disabled={columnsArray.fields.length >= MAX_COLUMNS}
          onClick={handleAddColumn}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-muted-300"
        >
          <Plus className="h-4 w-4" />
          Add Column
        </button>
      </div>

      <Accordion.Root type="multiple" value={openColumns} onValueChange={setOpenColumns} className="space-y-3">
        {columnsArray.fields.map((field, columnIndex) => (
          <FooterColumnFields
            key={field.id}
            control={control}
            register={register}
            errors={errors}
            columnIndex={columnIndex}
            isPersisted={columnIndex < savedColumnsCount}
            onRemoveColumn={() => setPendingDeleteIndex(columnIndex)}
          />
        ))}
      </Accordion.Root>

      <p className="text-xs text-muted-500">Up to {MAX_COLUMNS} columns.</p>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>

      <Modal
        open={pendingDeleteIndex !== null}
        onOpenChange={(open) => !open && setPendingDeleteIndex(null)}
        title="Delete column?"
      >
        <p className="text-sm text-muted-600">
          Delete column{" "}
          <span className="font-medium text-brand-950">{pendingDeleteTitle || "Untitled column"}</span> and all
          its items? This can&apos;t be undone once you save.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setPendingDeleteIndex(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            onClick={confirmRemoveColumn}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </form>
  );
}
