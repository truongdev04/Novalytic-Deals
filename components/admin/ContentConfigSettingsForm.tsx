"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
] as const;
type TabId = (typeof TABS)[number]["id"];

const paginationFields: { name: keyof AdminContentConfigSettingsInput["pagination"]; label: string }[] = [
  { name: "dealsPageSize", label: "Deals page size" },
  { name: "searchPageSize", label: "Search page size" },
  { name: "featuredStoresCount", label: "Featured stores on homepage" },
  { name: "featuredCategoriesCount", label: "Featured categories on homepage" },
  { name: "trendingDealsCount", label: "Trending deals on homepage" },
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
        storeFaqTemplate: settings.templates.storeFaqTemplate ?? [],
        storeSeoDescriptionTemplate: settings.templates.storeSeoDescriptionTemplate ?? "",
        storeSeoDescriptionFallbackTemplate:
          settings.templates.storeSeoDescriptionFallbackTemplate ?? "",
        couponDescriptionTemplate: settings.templates.couponDescriptionTemplate ?? "",
        couponTermsTemplate: settings.templates.couponTermsTemplate ?? "",
        blogSeoTitleTemplate: settings.templates.blogSeoTitleTemplate ?? "",
        blogExcerptTemplate: settings.templates.blogExcerptTemplate ?? "",
        blogSeoDescriptionTemplate: settings.templates.blogSeoDescriptionTemplate ?? "",
      },
    },
  });

  const faqArray = useFieldArray({ control, name: "templates.storeFaqTemplate" });

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
              <span className="text-sm font-medium text-brand-950">Store — FAQ template</span>
              <button
                type="button"
                onClick={() => faqArray.append({ question: "", answer: "" })}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </button>
            </div>
            <div className="space-y-3">
              {faqArray.fields.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-muted-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        placeholder="Question"
                        className={fieldClassName}
                        {...register(`templates.storeFaqTemplate.${index}.question` as const)}
                      />
                      <textarea
                        placeholder="Answer"
                        rows={2}
                        className={fieldClassName}
                        {...register(`templates.storeFaqTemplate.${index}.answer` as const)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => faqArray.remove(index)}
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
      </div>

      <div className="flex justify-end border-t border-muted-200 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
