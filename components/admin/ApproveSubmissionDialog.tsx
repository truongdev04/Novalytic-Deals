"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { adminCouponSchema, type AdminCouponInput } from "@/lib/validators/admin/coupon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const COUPON_TYPES = ["CODE", "DEAL", "FREESHIP"] as const;
const DISCOUNT_TYPES = ["PERCENT", "AMOUNT", "OTHER"] as const;
const CURRENCY_OPTIONS = ["$", "€", "£", "CHF"];

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

function randomCode(length = 6) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export interface ApproveSubmission {
  id: string;
  title: string;
  storeName: string;
  websiteUrl: string;
  code: string | null;
  discountUnit: string;
  discountValue: number;
  description: string;
  expiresAt: string | null;
}

export function ApproveSubmissionDialog({
  submission,
  stores,
  open,
  onOpenChange,
}: {
  submission: ApproveSubmission;
  stores: { id: string; name: string; slug: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);

  const defaultValues = useMemo<AdminCouponInput>(
    () => ({
      storeId: "",
      slug: `${slugify(submission.title) || "coupon"}-${randomCode()}`,
      title: submission.title,
      description: submission.description,
      type: "DEAL",
      code: submission.code ?? "",
      discountType: submission.discountUnit === "%" ? "PERCENT" : "AMOUNT",
      discountValue: submission.discountValue,
      currency:
        submission.discountUnit && submission.discountUnit !== "%" ? submission.discountUnit : "$",
      affiliateUrl: submission.websiteUrl,
      exclusive: false,
      verified: true,
      terms: "",
      startsAt: "",
      expiresAt: submission.expiresAt ? submission.expiresAt.slice(0, 10) : "",
      isFeatured: false,
    }),
    [submission]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminCouponInput>({
    resolver: zodResolver(adminCouponSchema),
    defaultValues,
  });

  const type = useWatch({ control, name: "type" });
  const discountType = useWatch({ control, name: "discountType" });

  async function onSubmit(data: AdminCouponInput) {
    try {
      const res = await fetch(`/api/admin/submitted-coupons/${submission.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to create coupon.";
        if (message.toLowerCase().includes("slug")) setError("slug", { message });
        toast.error(message);
        return;
      }
      toast.success("Coupon created and submission approved.");
      onOpenChange(false);
      reset(defaultValues);
      router.refresh();
    } catch {
      toast.error("Failed to create coupon.");
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Approve submission — create coupon"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-brand-950">Store{requiredMark()}</span>
          <p className="mb-1.5 text-xs text-muted-500">
            Suggested from the submission:{" "}
            <span className="font-medium text-brand-950">{submission.storeName}</span> — pick the
            matching store.
          </p>
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
                      setValue("slug", `${storeSlug}-${randomCode()}`, { shouldDirty: true });
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
          <label className="mb-1.5 block text-sm font-medium text-brand-950">Title{requiredMark()}</label>
          <input className={fieldClassName} {...register("title")} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-950">Slug{requiredMark()}</label>
          <input
            className={fieldClassName}
            {...register("slug", { onChange: () => setSlugTouched(true) })}
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-950">Description</label>
          <textarea rows={3} className={fieldClassName} {...register("description")} />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-950">Type{requiredMark()}</span>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <SingleSelectDropdown
                  options={COUPON_TYPES.map((t) => ({ value: t, label: t }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Code</label>
            <input className={fieldClassName} {...register("code")} />
          </div>
        </div>

        {type !== "FREESHIP" && (
          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              discountType === "AMOUNT" ? "sm:grid-cols-3" : "sm:grid-cols-2"
            )}
          >
            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Discount Type{requiredMark()}
              </span>
              <Controller
                control={control}
                name="discountType"
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={DISCOUNT_TYPES.map((t) => ({ value: t, label: t }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-950">
                Discount Value{requiredMark()}
              </label>
              <input
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
                <label className="mb-1.5 block text-sm font-medium text-brand-950">
                  Currency{requiredMark()}
                </label>
                <input
                  list="approve-currency-options"
                  className={fieldClassName}
                  {...register("currency")}
                />
                <datalist id="approve-currency-options">
                  {CURRENCY_OPTIONS.map((symbol) => (
                    <option key={symbol} value={symbol} />
                  ))}
                </datalist>
                {errors.currency && (
                  <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-950">
            Affiliate Link{requiredMark()}
          </label>
          <input className={fieldClassName} {...register("affiliateUrl")} />
          <p className="mt-1 text-xs text-muted-500">
            Pre-filled with the submission&apos;s website link — replace it with a real affiliate URL.
          </p>
          {errors.affiliateUrl && (
            <p className="mt-1 text-xs text-red-600">{errors.affiliateUrl.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-950">Terms</label>
          <textarea rows={2} className={fieldClassName} {...register("terms")} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Starts At</label>
            <input type="date" className={fieldClassName} {...register("startsAt")} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Expires At</label>
            <input type="date" className={fieldClassName} {...register("expiresAt")} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("exclusive")} />
            Exclusive
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("verified")} />
            Verified
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
            <input type="checkbox" className="h-4 w-4" {...register("isFeatured")} />
            Featured
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create coupon"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
