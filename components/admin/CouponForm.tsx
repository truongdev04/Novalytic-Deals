"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminCouponSchema, type AdminCouponInput } from "@/lib/validators/admin/coupon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { slugify } from "@/lib/utils";
import type { Coupon, CouponType, DiscountType, Store } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const COUPON_TYPES: CouponType[] = ["CODE", "DEAL", "CASHBACK", "FREESHIP", "BOGO"];
const DISCOUNT_TYPES: DiscountType[] = ["PERCENT", "AMOUNT", "OTHER"];

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function CouponForm({ coupon, stores }: { coupon?: Coupon; stores: Store[] }) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(coupon));
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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
          discountValue: 0,
          currency: "USD",
          affiliateUrl: "",
          exclusive: false,
          terms: "",
          startsAt: "",
          expiresAt: "",
          isFeatured: false,
          isTrending: false,
        },
  });

  async function onSubmit(data: AdminCouponInput) {
    try {
      const endpoint = coupon ? `/api/admin/coupons/${coupon.id}` : "/api/admin/coupons";
      const res = await fetch(endpoint, {
        method: coupon ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
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
            <select className={fieldClassName} {...register("storeId")}>
              <option value="">Select a store...</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
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
              {...register("title", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldDirty: true });
                },
              })}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-brand-950">
              Slug{requiredMark()}
            </label>
            <input
              id="slug"
              placeholder="e.g. amazon-20-off-everything"
              className={fieldClassName}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description{requiredMark()}
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                type="number"
                step="any"
                className={fieldClassName}
                {...register("discountValue", { valueAsNumber: true })}
              />
              {errors.discountValue && (
                <p className="mt-1 text-xs text-red-600">{errors.discountValue.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-brand-950">
                Currency{requiredMark()}
              </label>
              <input id="currency" placeholder="USD" className={fieldClassName} {...register("currency")} />
              {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>}
            </div>
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
              Terms{requiredMark()}
            </label>
            <textarea id="terms" rows={3} className={fieldClassName} {...register("terms")} />
            {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Starts At{requiredMark()}
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
              <input type="checkbox" className="h-4 w-4" {...register("isTrending")} />
              Trending
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
