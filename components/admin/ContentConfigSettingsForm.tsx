"use client";

import { useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import {
  adminContentConfigSettingsSchema,
  type AdminContentConfigSettingsInput,
} from "@/lib/validators/admin/settings";
import type { ContentConfigSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const storeTemplateHint = "Use {name} — it will be replaced with the store name.";
const couponTemplateHint =
  "Use {name} — it will be replaced with the coupon's store name (not the coupon title).";
const blogTemplateHint = "Use {name} — it will be replaced with the post title.";
const eventTemplateHint =
  "Use {name} — it will be replaced with the event's name. This single template is applied to every event's detail page (events have no per-event FAQ override).";
const randomBlockHint =
  "Add one variation per block, separated by a blank line — a variation can span multiple lines. A random block is picked for each store left blank.";
const couponDescriptionHint =
  "Add one variation per line. Unlike Store, when a new coupon is created with this field left blank, a random line is filled in and saved to the database right away (not just resolved for display later).";
const couponTermsHint =
  "Add one variation per block, separated by a blank line — a variation can span multiple lines. Same as Description: when a new coupon is created with this field left blank, a random block is filled in and saved to the database right away.";
const fixedStructureHint =
  "One fixed structure shared by every store. Supports {name} (store name), {discount} (best current coupon value, e.g. \"20%\"/\"$50\" — frozen for the current UTC month), {month}, {year}.";
const fallbackStructureHint =
  "Used instead of the field above when the store currently has no qualifying coupon for {discount} (also frozen monthly — see the field above). Supports {name}, {month}, {year} (no {discount}).";

const TABS = [
  { id: "pagination", label: "Listing & Pagination" },
  { id: "store", label: "Store Templates" },
  { id: "coupon", label: "Coupon Templates" },
  { id: "blog", label: "Blog Templates" },
  { id: "event", label: "Event Templates" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const paginationFields: { name: keyof AdminContentConfigSettingsInput["pagination"]; label: string }[] = [
  { name: "dealsPageSize", label: "Deals page size" },
  { name: "featuredStoresCount", label: "Featured stores on homepage" },
  { name: "featuredCategoriesCount", label: "Featured categories on homepage" },
  { name: "trendingDealsCount", label: "Trending coupon on homepage" },
  { name: "exclusiveCodesCount", label: "Exclusive Codes on homepage" },
  { name: "bestDealsCount", label: "Best deals on homepage" },
  { name: "featuredBlogCount", label: "Featured blog posts on homepage" },
];

type TemplateFieldConfig = {
  name: keyof AdminContentConfigSettingsInput["templates"];
  label: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
};

const storeTemplateFields: TemplateFieldConfig[] = [
  {
    name: "storeSeoTitleTemplate",
    label: "Store — SEO title",
    multiline: true,
    rows: 2,
    hint: fixedStructureHint,
  },
  {
    name: "storeSeoTitleFallbackTemplate",
    label: "Store — SEO title (fallback, no discount)",
    multiline: true,
    rows: 2,
    hint: fallbackStructureHint,
  },
  {
    name: "storeSeoDescriptionTemplate",
    label: "Store — SEO description",
    multiline: true,
    rows: 3,
    hint: fixedStructureHint,
  },
  {
    name: "storeSeoDescriptionFallbackTemplate",
    label: "Store — SEO description (fallback, no discount)",
    multiline: true,
    rows: 3,
    hint: fallbackStructureHint,
  },
  {
    name: "storeDescriptionTemplate",
    label: "Store — Description",
    multiline: true,
    rows: 8,
    hint: randomBlockHint,
  },
  { name: "storeHowToApplyTemplate", label: "Store — How To Apply", multiline: true, rows: 8 },
];

const couponTemplateFields: TemplateFieldConfig[] = [
  {
    name: "couponDescriptionTemplate",
    label: "Coupon — Description",
    multiline: true,
    rows: 6,
    hint: couponDescriptionHint,
  },
  {
    name: "couponTermsTemplate",
    label: "Coupon — Terms",
    multiline: true,
    rows: 6,
    hint: couponTermsHint,
  },
];

const blogTemplateFields: TemplateFieldConfig[] = [
  { name: "blogSeoTitleTemplate", label: "Blog — SEO title" },
  { name: "blogSeoDescriptionTemplate", label: "Blog — SEO description", multiline: true },
  { name: "blogExcerptTemplate", label: "Blog — Excerpt", multiline: true },
];

function TemplateField({
  name,
  label,
  multiline,
  rows = 3,
  hint,
  register,
}: TemplateFieldConfig & {
  register: ReturnType<typeof useForm<AdminContentConfigSettingsInput>>["register"];
}) {
  return (
    <div>
      <label htmlFor={`templates.${name}`} className="mb-1.5 block text-sm font-medium text-brand-950">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={`templates.${name}`}
          rows={rows}
          className={fieldClassName}
          {...register(`templates.${name}`)}
        />
      ) : (
        <input id={`templates.${name}`} className={fieldClassName} {...register(`templates.${name}`)} />
      )}
      {hint && <p className="mt-1 text-xs text-muted-500">{hint}</p>}
    </div>
  );
}

function FaqSetFields({
  control,
  register,
  setIndex,
  onRemoveSet,
}: {
  control: Control<AdminContentConfigSettingsInput>;
  register: UseFormRegister<AdminContentConfigSettingsInput>;
  setIndex: number;
  onRemoveSet: () => void;
}) {
  const itemsArray = useFieldArray({
    control,
    name: `templates.storeFaqTemplateSets.${setIndex}.items`,
  });

  return (
    <Accordion.Item value={String(setIndex)} className="overflow-hidden rounded-lg border border-muted-200">
      <div className="flex items-center justify-between gap-2 bg-surface-0 px-4 py-3">
        <Accordion.Header className="min-w-0 flex-1">
          <Accordion.Trigger className="group flex w-full items-center gap-3 text-left focus-visible:outline-none">
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-500 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
            <span className="truncate font-medium text-brand-950">FAQ Set {setIndex + 1}</span>
            <span className="shrink-0 text-xs text-muted-500">{itemsArray.fields.length} questions</span>
          </Accordion.Trigger>
        </Accordion.Header>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSet();
          }}
          aria-label="Remove FAQ set"
          className="shrink-0 rounded-lg p-1.5 text-muted-500 hover:bg-surface-100 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Accordion.Content className="space-y-3 border-t border-muted-200 bg-surface-0 p-4 data-[state=open]:animate-fade-in">
        {itemsArray.fields.map((item, itemIndex) => (
          <div key={item.id} className="rounded-lg border border-muted-200 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  placeholder="Question"
                  className={fieldClassName}
                  {...register(`templates.storeFaqTemplateSets.${setIndex}.items.${itemIndex}.question` as const)}
                />
                <textarea
                  placeholder="Answer"
                  rows={2}
                  className={fieldClassName}
                  {...register(`templates.storeFaqTemplateSets.${setIndex}.items.${itemIndex}.answer` as const)}
                />
              </div>
              <button
                type="button"
                onClick={() => itemsArray.remove(itemIndex)}
                aria-label="Remove question"
                className="rounded-lg p-1.5 text-muted-500 hover:bg-surface-100 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => itemsArray.append({ question: "", answer: "" })}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Question
        </button>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function ContentConfigSettingsForm({ settings }: { settings: ContentConfigSettings }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("pagination");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AdminContentConfigSettingsInput>({
    resolver: zodResolver(adminContentConfigSettingsSchema),
    defaultValues: {
      pagination: settings.pagination,
      templates: {
        storeSeoTitleTemplate: settings.templates.storeSeoTitleTemplate ?? "",
        storeSeoTitleFallbackTemplate: settings.templates.storeSeoTitleFallbackTemplate ?? "",
        storeDescriptionTemplate: settings.templates.storeDescriptionTemplate ?? "",
        storeAboutTemplate: settings.templates.storeAboutTemplate ?? "",
        storeHowToApplyTemplate: settings.templates.storeHowToApplyTemplate ?? "",
        storeFaqTemplateSets: settings.templates.storeFaqTemplateSets ?? [],
        storeSeoDescriptionTemplate: settings.templates.storeSeoDescriptionTemplate ?? "",
        storeSeoDescriptionFallbackTemplate:
          settings.templates.storeSeoDescriptionFallbackTemplate ?? "",
        couponDescriptionTemplate: settings.templates.couponDescriptionTemplate ?? "",
        couponTermsTemplate: settings.templates.couponTermsTemplate ?? "",
        blogSeoTitleTemplate: settings.templates.blogSeoTitleTemplate ?? "",
        blogExcerptTemplate: settings.templates.blogExcerptTemplate ?? "",
        blogSeoDescriptionTemplate: settings.templates.blogSeoDescriptionTemplate ?? "",
        eventFaqTemplate: settings.templates.eventFaqTemplate ?? [],
      },
    },
  });

  const faqSetsArray = useFieldArray({ control, name: "templates.storeFaqTemplateSets" });
  const eventFaqArray = useFieldArray({ control, name: "templates.eventFaqTemplate" });
  const [openFaqSets, setOpenFaqSets] = useState<string[]>([]);
  const [pendingDeleteFaqSetIndex, setPendingDeleteFaqSetIndex] = useState<number | null>(null);
  const pendingDeleteFaqSetItems =
    useWatch({
      control,
      name:
        pendingDeleteFaqSetIndex !== null
          ? (`templates.storeFaqTemplateSets.${pendingDeleteFaqSetIndex}.items` as const)
          : "templates.storeFaqTemplateSets.0.items",
    }) ?? [];

  function handleAddFaqSet() {
    const newIndex = faqSetsArray.fields.length;
    faqSetsArray.append({
      setId: crypto.randomUUID(),
      items: Array.from({ length: 5 }, () => ({ question: "", answer: "" })),
    });
    setOpenFaqSets((prev) => [...prev, String(newIndex)]);
  }

  function handleRemoveFaqSet(index: number) {
    faqSetsArray.remove(index);
    setOpenFaqSets((prev) =>
      prev
        .filter((value) => value !== String(index))
        .map((value) => (Number(value) > index ? String(Number(value) - 1) : value))
    );
  }

  function confirmRemoveFaqSet() {
    if (pendingDeleteFaqSetIndex === null) return;
    handleRemoveFaqSet(pendingDeleteFaqSetIndex);
    setPendingDeleteFaqSetIndex(null);
  }

  async function onSubmit(data: AdminContentConfigSettingsInput) {
    try {
      const res = await fetch("/api/admin/settings/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Settings saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full md:w-4/5">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-muted-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-muted-500 hover:text-brand-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 pt-6">
        <section hidden={activeTab !== "pagination"} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {paginationFields.map(({ name, label }) => (
              <div key={name}>
                <label
                  htmlFor={`pagination.${name}`}
                  className="mb-1.5 block text-sm font-medium text-brand-950"
                >
                  {label}
                </label>
                <input
                  id={`pagination.${name}`}
                  type="number"
                  min={1}
                  className={fieldClassName}
                  {...register(`pagination.${name}`, { valueAsNumber: true })}
                />
                {errors.pagination?.[name] && (
                  <p className="mt-1 text-xs text-red-600">{errors.pagination[name]?.message}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section hidden={activeTab !== "store"} className="space-y-4">
          <p className="text-xs text-muted-500">{storeTemplateHint}</p>
          {storeTemplateFields.map((field) => (
            <TemplateField key={field.name} {...field} register={register} />
          ))}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-brand-950">Store — FAQ template sets</span>
              <button
                type="button"
                onClick={handleAddFaqSet}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" />
                Add FAQ Set
              </button>
            </div>
            <p className="mb-2 text-xs text-muted-500">
              Each store with no FAQ of its own is deterministically assigned to exactly one set
              below (based on a stable hash of the store), not all sets combined. Deleting a set
              only reassigns the stores that were on it — other stores are unaffected.
            </p>
            <Accordion.Root
              type="multiple"
              value={openFaqSets}
              onValueChange={setOpenFaqSets}
              className="space-y-3"
            >
              {faqSetsArray.fields.map((field, setIndex) => (
                <FaqSetFields
                  key={field.id}
                  control={control}
                  register={register}
                  setIndex={setIndex}
                  onRemoveSet={() => setPendingDeleteFaqSetIndex(setIndex)}
                />
              ))}
            </Accordion.Root>
            {faqSetsArray.fields.length === 0 && (
              <p className="text-xs text-muted-400">No FAQ sets yet.</p>
            )}
          </div>
        </section>

        <section hidden={activeTab !== "coupon"} className="space-y-4">
          <p className="text-xs text-muted-500">{couponTemplateHint}</p>
          {couponTemplateFields.map((field) => (
            <TemplateField key={field.name} {...field} register={register} />
          ))}
        </section>

        <section hidden={activeTab !== "blog"} className="space-y-4">
          <p className="text-xs text-muted-500">{blogTemplateHint}</p>
          {blogTemplateFields.map((field) => (
            <TemplateField key={field.name} {...field} register={register} />
          ))}
        </section>

        <section hidden={activeTab !== "event"} className="space-y-4">
          <p className="text-xs text-muted-500">{eventTemplateHint}</p>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-brand-950">Event — FAQ template</span>
              <button
                type="button"
                onClick={() => eventFaqArray.append({ question: "", answer: "" })}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </button>
            </div>
            <div className="space-y-3">
              {eventFaqArray.fields.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-muted-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        placeholder="Question"
                        className={fieldClassName}
                        {...register(`templates.eventFaqTemplate.${index}.question` as const)}
                      />
                      <textarea
                        placeholder="Answer"
                        rows={2}
                        className={fieldClassName}
                        {...register(`templates.eventFaqTemplate.${index}.answer` as const)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => eventFaqArray.remove(index)}
                      aria-label="Remove FAQ"
                      className="rounded-lg p-1.5 text-muted-500 hover:bg-surface-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end border-t border-muted-200 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>

      <Modal
        open={pendingDeleteFaqSetIndex !== null}
        onOpenChange={(open) => !open && setPendingDeleteFaqSetIndex(null)}
        title="Delete FAQ set?"
      >
        <p className="text-sm text-muted-600">
          Delete FAQ Set {pendingDeleteFaqSetIndex !== null ? pendingDeleteFaqSetIndex + 1 : ""} and
          its {pendingDeleteFaqSetItems.length} question
          {pendingDeleteFaqSetItems.length === 1 ? "" : "s"}? This can&apos;t be undone once you
          save.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setPendingDeleteFaqSetIndex(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            onClick={confirmRemoveFaqSet}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </form>
  );
}
