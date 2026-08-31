"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { ArrowLeft } from "lucide-react";
import {
  adminSubmittedCouponSchema,
  type AdminSubmittedCouponInput,
} from "@/lib/validators/admin/submittedCoupon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { cn } from "@/lib/utils";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const DISCOUNT_UNITS = ["%", "$", "€", "£"];

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export interface EditableSubmission {
  id: string;
  title: string;
  storeName: string;
  websiteUrl: string;
  code: string | null;
  discountUnit: string;
  discountValue: number;
  description: string;
  expiresAt: string | null;
  submitterEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export function SubmissionEditForm({ submission }: { submission: EditableSubmission }) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminSubmittedCouponInput>({
    resolver: zodResolver(adminSubmittedCouponSchema),
    defaultValues: {
      title: submission.title,
      storeName: submission.storeName,
      websiteUrl: submission.websiteUrl,
      code: submission.code ?? "",
      discountUnit: submission.discountUnit,
      discountValue: submission.discountValue,
      description: submission.description,
      expiresAt: submission.expiresAt ? submission.expiresAt.slice(0, 10) : "",
      submitterEmail: submission.submitterEmail,
    },
  });

  async function onSubmit(data: AdminSubmittedCouponInput) {
    try {
      const res = await fetch(`/api/admin/submitted-coupons/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to save submission.");
        return;
      }
      toast.success("Submission updated.");
      router.push("/admin/submissions");
      router.refresh();
    } catch {
      toast.error("Failed to save submission.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push("/admin/submissions");
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
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold text-brand-950">Edit submission</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium uppercase",
                submission.status === "APPROVED"
                  ? "bg-brand-50 text-brand-700"
                  : submission.status === "REJECTED"
                    ? "bg-red-50 text-red-600"
                    : "bg-accent-50 text-accent-700"
              )}
            >
              {submission.status}
            </span>
          </div>

          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-brand-950">
              Title{requiredMark()}
            </label>
            <input id="title" className={fieldClassName} {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="storeName" className="mb-1.5 block text-sm font-medium text-brand-950">
              Store name{requiredMark()}
            </label>
            <input id="storeName" className={fieldClassName} {...register("storeName")} />
            {errors.storeName && (
              <p className="mt-1 text-xs text-red-600">{errors.storeName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="websiteUrl" className="mb-1.5 block text-sm font-medium text-brand-950">
              Website URL{requiredMark()}
            </label>
            <input id="websiteUrl" className={fieldClassName} {...register("websiteUrl")} />
            {errors.websiteUrl && (
              <p className="mt-1 text-xs text-red-600">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-brand-950">
                Code <span className="text-muted-400">(optional)</span>
              </label>
              <input id="code" className={fieldClassName} {...register("code")} />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-brand-950">
                Discount unit{requiredMark()}
              </span>
              <Controller
                control={control}
                name="discountUnit"
                render={({ field }) => (
                  <SingleSelectDropdown
                    options={DISCOUNT_UNITS.map((u) => ({ value: u, label: u }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div>
              <label
                htmlFor="discountValue"
                className="mb-1.5 block text-sm font-medium text-brand-950"
              >
                Discount value{requiredMark()}
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
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
              Description{requiredMark()}
            </label>
            <textarea
              id="description"
              rows={4}
              className={fieldClassName}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium text-brand-950">
                Expires at <span className="text-muted-400">(optional)</span>
              </label>
              <input id="expiresAt" type="date" className={fieldClassName} {...register("expiresAt")} />
            </div>

            <div>
              <label
                htmlFor="submitterEmail"
                className="mb-1.5 block text-sm font-medium text-brand-950"
              >
                Submitter email{requiredMark()}
              </label>
              <input id="submitterEmail" className={fieldClassName} {...register("submitterEmail")} />
              {errors.submitterEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.submitterEmail.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
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
          <Button variant="primary" onClick={() => router.push("/admin/submissions")}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
