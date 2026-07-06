"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { adminStoreSchema, type AdminStoreInput } from "@/lib/validators/admin/store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { FaqPasteModal } from "@/components/admin/FaqPasteModal";
import { slugify } from "@/lib/utils";
import { resolveRichTextImages } from "@/lib/richTextImageUpload";
import type { Category, Event, Store } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function StoreForm({
  store,
  categories,
  events,
}: {
  store?: Store;
  categories: Category[];
  events: Event[];
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(store));
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFaqPaste, setShowFaqPaste] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoProvider, setPendingLogoProvider] = useState<StorageProvider>("cloudinary");
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
  const [pendingBannerProvider, setPendingBannerProvider] = useState<StorageProvider>("cloudinary");

  async function uploadPendingImage(file: File, provider: StorageProvider): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("provider", provider);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.data?.url) {
      throw new Error(body?.error || "Image upload failed");
    }
    return body.data.url;
  }

  const currentEventId = store?.eventId ?? null;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminStoreInput>({
    resolver: zodResolver(adminStoreSchema),
    defaultValues: store
      ? {
          slug: store.slug,
          name: store.name,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl ?? "",
          website: store.website,
          affiliateNetwork: store.affiliateNetwork,
          categoryIds: store.categoryIds,
          eventId: currentEventId,
          description: store.description,
          aboutStore: store.aboutStore,
          howToApply: store.howToApply ?? "",
          faq: store.faq,
          isFeatured: store.isFeatured,
          seoTitle: store.seo.title,
          seoDescription: store.seo.description,
        }
      : {
          slug: "",
          name: "",
          logoUrl: "",
          bannerUrl: "",
          website: "",
          affiliateNetwork: "",
          categoryIds: [],
          eventId: null,
          description: "",
          aboutStore: "",
          howToApply: "",
          faq: [],
          isFeatured: false,
          seoTitle: "",
          seoDescription: "",
        },
  });

  const faqArray = useFieldArray({ control, name: "faq" });

  async function onSubmit(data: AdminStoreInput) {
    try {
      // Images inserted into the rich-text fields, plus the Logo/Banner
      // fields, are only local previews until now — upload them all right
      // before saving so a draft that's never submitted never orphans an
      // image on Cloudinary/Supabase.
      const [description, aboutStore, howToApply, logoUrl, bannerUrl] = await Promise.all([
        resolveRichTextImages(data.description),
        resolveRichTextImages(data.aboutStore),
        data.howToApply ? resolveRichTextImages(data.howToApply) : Promise.resolve(data.howToApply),
        pendingLogoFile
          ? uploadPendingImage(pendingLogoFile, pendingLogoProvider)
          : Promise.resolve(data.logoUrl),
        pendingBannerFile
          ? uploadPendingImage(pendingBannerFile, pendingBannerProvider)
          : Promise.resolve(data.bannerUrl),
      ]);

      const endpoint = store ? `/api/admin/stores/${store.id}` : "/api/admin/stores";
      const res = await fetch(endpoint, {
        method: store ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, description, aboutStore, howToApply, logoUrl, bannerUrl }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(store ? "Store updated." : "Store created.");
      router.push("/admin/stores");
      router.refresh();
    } catch {
      toast.error("Failed to save store.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/stores");
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
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-950">
              Name{requiredMark()}
            </label>
            <input
              id="name"
              placeholder="e.g. Amazon"
              className={fieldClassName}
              {...register("name", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldDirty: true });
                },
              })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
              Slug{requiredMark()}
            </label>
            <input
              id="slug"
              placeholder="e.g. amazon"
              className={fieldClassName}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Logo"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.logoUrl?.message}
                  deferUpload
                  onFileSelected={(file, provider) => {
                    setPendingLogoFile(file);
                    setPendingLogoProvider(provider);
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="bannerUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Banner"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  aspectClassName="aspect-video w-48"
                  deferUpload
                  onFileSelected={(file, provider) => {
                    setPendingBannerFile(file);
                    setPendingBannerProvider(provider);
                  }}
                />
              )}
            />
          </div>

          <div>
            <label htmlFor="website" className="mb-1.5 block text-sm font-medium text-brand-950">
              Website{requiredMark()}
            </label>
            <input
              id="website"
              placeholder="https://example.com"
              className={fieldClassName}
              {...register("website")}
            />
            {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>}
          </div>

          <div>
            <label
              htmlFor="affiliateNetwork"
              className="mb-1.5 block text-sm font-medium text-brand-950"
            >
              Affiliate Link{requiredMark()}
            </label>
            <input
              id="affiliateNetwork"
              placeholder="https://affiliate-network.com/track/..."
              className={fieldClassName}
              {...register("affiliateNetwork")}
            />
            {errors.affiliateNetwork && (
              <p className="mt-1 text-xs text-red-600">{errors.affiliateNetwork.message}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Category{requiredMark()}
            </span>
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <SingleSelectDropdown
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={field.value[0] ?? ""}
                  onChange={(next) => field.onChange(next ? [next] : [])}
                  placeholder="Select a category..."
                  visibleCount={15}
                />
              )}
            />
            {errors.categoryIds && (
              <p className="mt-1 text-xs text-red-600">{errors.categoryIds.message}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">Event</span>
            <Controller
              control={control}
              name="eventId"
              render={({ field }) => (
                <select
                  className={fieldClassName}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                >
                  <option value="">Uncategorized</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Description{requiredMark()}
            </span>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Short blurb shown on store cards and listings"
                  minHeightClassName="min-h-20"
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              About Store{requiredMark()}
            </span>
            <Controller
              control={control}
              name="aboutStore"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Tell shoppers about this store, what it sells, and why it's worth checking out"
                  minHeightClassName="min-h-56"
                />
              )}
            />
            {errors.aboutStore && (
              <p className="mt-1 text-xs text-red-600">{errors.aboutStore.message}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              How To Apply <span className="text-muted-400">(optional)</span>
            </span>
            <Controller
              control={control}
              name="howToApply"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Steps shoppers should follow to redeem a coupon at checkout"
                  minHeightClassName="min-h-40"
                />
              )}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-brand-950">
                FAQs <span className="text-muted-400">(optional)</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFaqPaste(true)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste FAQs
                </button>
                <button
                  type="button"
                  onClick={() => faqArray.append({ question: "", answer: "" })}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add FAQ
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {faqArray.fields.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-muted-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        placeholder="Question"
                        className={fieldClassName}
                        {...register(`faq.${index}.question` as const)}
                      />
                      <textarea
                        placeholder="Answer"
                        rows={2}
                        className={fieldClassName}
                        {...register(`faq.${index}.answer` as const)}
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
                  {errors.faq?.[index] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.faq[index]?.question?.message || errors.faq[index]?.answer?.message}
                    </p>
                  )}
                </div>
              ))}
              {faqArray.fields.length === 0 && (
                <p className="text-xs text-muted-400">No FAQs added yet.</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="seoTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
              SEO Title{requiredMark()}
            </label>
            <input
              id="seoTitle"
              placeholder="e.g. Amazon Coupons & Promo Codes — Up to 20% Off"
              className={fieldClassName}
              {...register("seoTitle")}
            />
            {errors.seoTitle && <p className="mt-1 text-xs text-red-600">{errors.seoTitle.message}</p>}
          </div>

          <div>
            <label
              htmlFor="seoDescription"
              className="mb-1.5 block text-sm font-medium text-brand-950"
            >
              SEO Description{requiredMark()}
            </label>
            <textarea
              id="seoDescription"
              rows={4}
              placeholder="Meta description shown in Google search results"
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

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : store ? "Update Store" : "Create Store"}
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
          <Button variant="primary" onClick={() => router.push("/admin/stores")}>
            Discard changes
          </Button>
        </div>
      </Modal>

      <FaqPasteModal
        open={showFaqPaste}
        onOpenChange={setShowFaqPaste}
        onParsed={(items) => faqArray.append(items)}
      />
    </>
  );
}
