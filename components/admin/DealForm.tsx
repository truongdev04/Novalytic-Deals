"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminDealSchema, type AdminDealInput } from "@/lib/validators/admin/deal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import type { Category, Deal, DealType, Event, Store } from "@/types";

const NONE_CATEGORY_VALUE = "";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const DEAL_TYPES: DealType[] = ["DEAL", "CODE"];

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

function generateRandomCode(length = 12) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function DealForm({
  deal,
  stores,
  events,
  categories,
}: {
  deal?: Deal;
  stores: Store[];
  events: Event[];
  categories: Category[];
}) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImageProvider, setPendingImageProvider] = useState<StorageProvider>("cloudinary");
  // Slug stays untouched once the admin edits it directly, or once editing
  // an existing deal (never regenerate a published slug) — same guard
  // CouponForm uses for its store-driven slug regeneration.
  const [slugTouched, setSlugTouched] = useState(Boolean(deal));
  // Offer is auto-computed from Original Price/Price until the admin edits
  // it directly, after which it's left alone.
  const [offerTouched, setOfferTouched] = useState(Boolean(deal?.offer));

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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminDealInput>({
    resolver: zodResolver(adminDealSchema),
    defaultValues: deal
      ? {
          storeId: deal.storeId,
          slug: deal.slug,
          name: deal.name,
          type: deal.type,
          code: deal.code ?? "",
          eventId: deal.eventId,
          categoryId: deal.categoryId,
          originalPrice: deal.originalPrice,
          price: deal.price,
          offer: deal.offer ?? "",
          url: deal.url,
          imageUrl: deal.imageUrl,
          description: deal.description ?? "",
          isFeatured: deal.isFeatured,
        }
      : {
          storeId: "",
          slug: "",
          name: "",
          type: "DEAL",
          code: "",
          eventId: null,
          categoryId: null,
          originalPrice: undefined,
          price: 0,
          offer: "",
          url: "",
          imageUrl: "",
          description: "",
          isFeatured: false,
        },
  });

  const type = useWatch({ control, name: "type" });
  const originalPrice = useWatch({ control, name: "originalPrice" });
  const price = useWatch({ control, name: "price" });

  // Auto-fill the Offer badge ("-20%") from Original Price/Price as soon as
  // both are present, until the admin edits Offer directly — same
  // touched-guard pattern as the slug auto-fill below.
  useEffect(() => {
    if (offerTouched) return;
    if (
      typeof originalPrice === "number" &&
      originalPrice > 0 &&
      typeof price === "number" &&
      price >= 0 &&
      price < originalPrice
    ) {
      const percentOff = Math.round(((originalPrice - price) / originalPrice) * 100);
      setValue("offer", `-${percentOff}%`, { shouldDirty: true });
    }
  }, [originalPrice, price, offerTouched, setValue]);

  async function onSubmit(data: AdminDealInput) {
    try {
      const imageUrl = pendingImageFile
        ? await uploadPendingImage(pendingImageFile, pendingImageProvider)
        : data.imageUrl;

      const endpoint = deal ? `/api/admin/deals/${deal.id}` : "/api/admin/deals";
      const res = await fetch(endpoint, {
        method: deal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, imageUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to save deal.";
        if (message.toLowerCase().includes("slug")) {
          setError("slug", { message });
        }
        toast.error(message);
        return;
      }
      toast.success(deal ? "Deal updated." : "Deal created.");
      router.push("/admin/deals");
      router.refresh();
    } catch {
      toast.error("Failed to save deal.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/deals");
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
              placeholder="e.g. 20% Off Wireless Headphones"
              className={fieldClassName}
              {...register("name", {
                onChange: () => {
                  if (!deal && !slugTouched && !getValues("slug")) {
                    setValue("slug", `deals-${generateRandomCode()}`, { shouldDirty: true });
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
            <input
              id="slug"
              placeholder="e.g. deals-a1b2c3d4e5f6"
              className={fieldClassName}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Store{requiredMark()}
            </span>
            <Controller
              control={control}
              name="storeId"
              render={({ field }) => (
                <SingleSelectDropdown
                  options={stores.map((store) => ({ value: store.id, label: store.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a store..."
                  searchable
                  searchPlaceholder="Search stores..."
                />
              )}
            />
            {errors.storeId && <p className="mt-1 text-xs text-red-600">{errors.storeId.message}</p>}
          </div>

          <div className={type === "CODE" ? "grid grid-cols-1 gap-5 sm:grid-cols-2" : ""}>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Type{requiredMark()}
              </span>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={DEAL_TYPES.map((t) => ({ value: t, label: t }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {type === "CODE" && (
              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-brand-950">
                  Code{requiredMark()}
                </label>
                <input id="code" placeholder="e.g. SAVE20" className={fieldClassName} {...register("code")} />
                {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
              </div>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">Event</span>
            <Controller
              control={control}
              name="eventId"
              render={({ field }) => (
                <SingleSelectDropdown
                  options={[
                    { value: "", label: "Uncategorized" },
                    ...events.map((event) => ({ value: event.id, label: event.name })),
                  ]}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value || null)}
                  placeholder="Uncategorized"
                  searchable
                  searchPlaceholder="Search events..."
                />
              )}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">
              Category <span className="text-muted-400">(optional)</span>
            </span>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <SingleSelectDropdown
                  options={[
                    { value: NONE_CATEGORY_VALUE, label: "None" },
                    ...categories.map((category) => ({ value: category.id, label: category.name })),
                  ]}
                  value={field.value ?? NONE_CATEGORY_VALUE}
                  onChange={(value) => field.onChange(value || null)}
                  placeholder="Select a category..."
                  searchable
                  searchPlaceholder="Search categories..."
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="originalPrice"
                className="mb-1.5 block text-sm font-medium text-brand-950"
              >
                Original Price <span className="text-muted-400">(optional)</span>
              </label>
              <input
                id="originalPrice"
                type="text"
                inputMode="decimal"
                className={fieldClassName}
                {...register("originalPrice", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.originalPrice && (
                <p className="mt-1 text-xs text-red-600">{errors.originalPrice.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-brand-950">
                Price{requiredMark()}
              </label>
              <input
                id="price"
                type="text"
                inputMode="decimal"
                className={fieldClassName}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="offer" className="mb-1.5 block text-sm font-medium text-brand-950">
              Offer <span className="text-muted-400">(optional)</span>
            </label>
            <input
              id="offer"
              placeholder="e.g. -20%"
              className={fieldClassName}
              {...register("offer", { onChange: () => setOfferTouched(true) })}
            />
            <p className="mt-1 text-xs text-muted-500">
              Auto-calculated from Original Price and Price — edit to override.
            </p>
            {errors.offer && <p className="mt-1 text-xs text-red-600">{errors.offer.message}</p>}
          </div>

          <div>
            <label htmlFor="url" className="mb-1.5 block text-sm font-medium text-brand-950">
              URL{requiredMark()}
            </label>
            <input
              id="url"
              placeholder="https://example.com/product"
              className={fieldClassName}
              {...register("url")}
            />
            {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url.message}</p>}
          </div>

          <Controller
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <ImageUploadField
                label="Image"
                required
                value={field.value}
                onChange={field.onChange}
                error={errors.imageUrl?.message}
                aspectClassName="aspect-square w-32"
                deferUpload
                onFileSelected={(file, provider) => {
                  setPendingImageFile(file);
                  setPendingImageProvider(provider);
                }}
              />
            )}
          />

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description <span className="text-muted-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              className={fieldClassName}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
            Featured
          </label>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : deal ? "Update Deal" : "Create Deal"}
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
          <Button variant="primary" onClick={() => router.push("/admin/deals")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
