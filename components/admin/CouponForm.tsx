"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminCouponSchema, type AdminCouponInput } from "@/lib/validators/admin/coupon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { applyTemplate, pickRandomLine, pickRandomBlock } from "@/lib/content/template";
import type { ContentConfigTemplates, Coupon, CouponType, DiscountType, Store } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const COUPON_TYPES: CouponType[] = ["CODE", "DEAL", "FREESHIP"];
const DISCOUNT_TYPES: DiscountType[] = ["PERCENT", "AMOUNT", "OTHER"];
const CURRENCY_OPTIONS = ["$", "€", "£", "CHF"];

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

function generateRandomCode(length = 12) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function CouponForm({
  coupon,
  stores,
  templates,
}: {
  coupon?: Coupon;
  stores: Store[];
  templates: ContentConfigTemplates;
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(coupon));
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminCouponInput>({
    resolver: zodResolver(adminCouponSchema),
    defaultValues: coupon
      ? {
          storeId: coupon.storeId,
          slug: coupon.slug,
          title: coupon.title,
          description: coupon.description,
          type: coupon.type,
          code: coupon.code ?? "",
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          currency: coupon.currency,
          affiliateUrl: coupon.affiliateUrl,
          exclusive: coupon.exclusive,
          verified: coupon.verified,
          terms: coupon.terms,
          startsAt: toDateInput(coupon.startsAt),
          expiresAt: toDateInput(coupon.expiresAt),
          isFeatured: coupon.isFeatured,
          isTrending: coupon.isTrending,
        }
      : {
          storeId: "",
          slug: "",
          title: "",
          description: "",
          type: "CODE",
          code: "",
          discountType: "PERCENT",
          currency: "$",
          affiliateUrl: "",
          exclusive: false,
          verified: true,
          terms: "",
          startsAt: "",
          expiresAt: "",
          isFeatured: false,
          isTrending: false,
        },
  });

  const discountType = useWatch({ control, name: "discountType" });
  const selectedStoreId = useWatch({ control, name: "storeId" });
  const selectedStoreName = stores.find((s) => s.id === selectedStoreId)?.name ?? "";
  // Picked once per mount (not re-randomized on submit) so the placeholder
  // preview and the value actually saved when creating a coupon match
  // exactly — no surprise mismatch between what the admin saw and what got
  // written to the DB.
  const [descriptionPick] = useState(() => pickRandomLine(templates.couponDescriptionTemplate));
  const [termsPick] = useState(() => pickRandomBlock(templates.couponTermsTemplate));
  const descriptionPlaceholder = applyTemplate(descriptionPick, selectedStoreName);
  const termsPlaceholder = applyTemplate(termsPick, selectedStoreName);

  async function onSubmit(data: AdminCouponInput) {
    try {
      // Only for a brand-new coupon: a field left blank gets filled in for
      // real with a random template from Content Configuration and saved —
      // unlike Store, this isn't resolved lazily on the public page.
      // Editing an existing coupon never overrides a blank field this way.
      const storeName = stores.find((s) => s.id === data.storeId)?.name ?? "";
      const description =
        !coupon && !data.description ? applyTemplate(descriptionPick, storeName) : data.description;
      const terms = !coupon && !data.terms ? applyTemplate(termsPick, storeName) : data.terms;

      const endpoint = coupon ? `/api/admin/coupons/${coupon.id}` : "/api/admin/coupons";
      const res = await fetch(endpoint, {
        method: coupon ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, description, terms }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to save coupon.";
        if (message.toLowerCase().includes("slug")) {
          setError("slug", { message });
        }
        toast.error(message);
        return;
      }
      toast.success(coupon ? "Coupon updated." : "Coupon created.");
      router.push("/admin/coupons");
      router.refresh();
    } catch {
      toast.error("Failed to save coupon.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/coupons");
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
                  onChange={(value) => {
                    field.onChange(value);
                    if (!slugTouched) {
                      const storeSlug = stores.find((s) => s.id === value)?.slug;
                      if (storeSlug) {
                        setValue("slug", `${storeSlug}-${generateRandomCode()}`, {
                          shouldDirty: true,
                        });
                      }
                    }
                  }}
                  placeholder="Select a store..."
                  searchable
                  searchPlaceholder="Search stores..."
                />
              )}
            />
            {errors.storeId && <p className="mt-1 text-xs text-red-600">{errors.storeId.message}</p>}
          </div>

          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-brand-950">
              Title{requiredMark()}
            </label>
            <input
              id="title"
              placeholder="e.g. 20% Off Everything"
              className={fieldClassName}
              {...register("title")}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
              Slug{requiredMark()}
            </label>
            <input
              id="slug"
              placeholder="e.g. amazon-a1b2c3d4e5f6"
              className={fieldClassName}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description <span className="text-muted-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder={descriptionPlaceholder}
              className={fieldClassName}
              {...register("description")}
            />
            <p className="mt-1 text-xs text-muted-500">
              Leave blank — a random Coupon Description template is filled in and saved when you
              create this coupon.
            </p>
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Type{requiredMark()}
              </span>
              <select className={fieldClassName} {...register("type")}>
                {COUPON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-brand-950">
                Code <span className="text-muted-400">(optional)</span>
              </label>
              <input id="code" placeholder="e.g. SAVE20" className={fieldClassName} {...register("code")} />
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-5",
              discountType === "AMOUNT" ? "sm:grid-cols-3" : "sm:grid-cols-2"
            )}
          >
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Discount Type{requiredMark()}
              </span>
              <select className={fieldClassName} {...register("discountType")}>
                {DISCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="discountValue"
                className="mb-1.5 block text-sm font-medium text-brand-950"
              >
                Discount Value{requiredMark()}
              </label>
              <input
                id="discountValue"
                type="text"
                inputMode="decimal"
                className={fieldClassName}
                {...register("discountValue", { valueAsNumber: true })}
              />
              {errors.discountValue && (
                <p className="mt-1 text-xs text-red-600">{errors.discountValue.message}</p>
              )}
            </div>

            {discountType === "AMOUNT" && (
              <div>
                <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-brand-950">
                  Currency{requiredMark()}
                </label>
                <input
                  id="currency"
                  list="currency-options"
                  placeholder="e.g. $"
                  className={fieldClassName}
                  {...register("currency")}
                />
                <datalist id="currency-options">
                  {CURRENCY_OPTIONS.map((symbol) => (
                    <option key={symbol} value={symbol} />
                  ))}
                </datalist>
                {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="affiliateUrl" className="mb-1.5 block text-sm font-medium text-brand-950">
              Affiliate Link{requiredMark()}
            </label>
            <input
              id="affiliateUrl"
              placeholder="https://affiliate-network.com/track/..."
              className={fieldClassName}
              {...register("affiliateUrl")}
            />
            {errors.affiliateUrl && (
              <p className="mt-1 text-xs text-red-600">{errors.affiliateUrl.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="terms" className="mb-1.5 block text-sm font-medium text-brand-950">
              Terms <span className="text-muted-400">(optional)</span>
            </label>
            <p className="mb-1.5 text-xs text-muted-500">
              Leave blank — a random Coupon Terms template is filled in and saved when you create
              this coupon.
            </p>
            <textarea
              id="terms"
              rows={3}
              placeholder={termsPlaceholder}
              className={fieldClassName}
              {...register("terms")}
            />
            {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Starts At <span className="text-muted-400">(optional)</span>
              </label>
              <input id="startsAt" type="date" className={fieldClassName} {...register("startsAt")} />
              {errors.startsAt && <p className="mt-1 text-xs text-red-600">{errors.startsAt.message}</p>}
            </div>

            <div>
              <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Expires At <span className="text-muted-400">(optional)</span>
              </label>
              <input id="expiresAt" type="date" className={fieldClassName} {...register("expiresAt")} />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
              <input type="checkbox" className="h-4 w-4" {...register("exclusive")} />
              Exclusive
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
              <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
              <input type="checkbox" className="h-4 w-4" {...register("verified")} />
              Verified
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
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
          <Button variant="primary" onClick={() => router.push("/admin/coupons")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
