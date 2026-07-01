"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitCouponSchema, type SubmitCouponInput } from "@/lib/validators/submitCoupon";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function SubmitCouponForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitCouponInput>({ resolver: zodResolver(submitCouponSchema) });

  async function onSubmit() {
    // TODO(backend): POST /api/submit-coupon — goes to the moderation queue
    // with rate limiting (3/day), honeypot, and Turnstile verification.
    await new Promise((resolve) => setTimeout(resolve, 400));
    toast.success("Thanks! Your coupon was submitted for review.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="storeName" className="mb-1.5 block text-sm font-medium text-brand-950">
          Store name
        </label>
        <input
          id="storeName"
          placeholder="e.g. Amazon"
          aria-invalid={Boolean(errors.storeName)}
          aria-describedby={errors.storeName ? "storeName-error" : undefined}
          className={fieldClassName}
          {...register("storeName")}
        />
        {errors.storeName && (
          <p id="storeName-error" className="mt-1 text-xs text-red-600">
            {errors.storeName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-brand-950">
          Coupon code <span className="text-muted-400">(optional for deals)</span>
        </label>
        <input id="code" placeholder="e.g. SAVE20" className={fieldClassName} {...register("code")} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="What discount does this coupon offer?"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
          className={fieldClassName}
          {...register("description")}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium text-brand-950">
          Expiration date <span className="text-muted-400">(optional)</span>
        </label>
        <input id="expiresAt" type="date" className={fieldClassName} {...register("expiresAt")} />
      </div>

      <div>
        <label htmlFor="submitterEmail" className="mb-1.5 block text-sm font-medium text-brand-950">
          Your email
        </label>
        <input
          id="submitterEmail"
          type="email"
          aria-invalid={Boolean(errors.submitterEmail)}
          aria-describedby={errors.submitterEmail ? "submitterEmail-error" : undefined}
          className={fieldClassName}
          {...register("submitterEmail")}
        />
        {errors.submitterEmail && (
          <p id="submitterEmail-error" className="mt-1 text-xs text-red-600">
            {errors.submitterEmail.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit coupon"}
      </Button>
    </form>
  );
}
