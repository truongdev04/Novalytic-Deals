"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  adminRedirectRuleSchema,
  type AdminRedirectRuleInput,
} from "@/lib/validators/admin/redirectRule";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import type { RedirectRule } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const BACK_HREF = "/admin/settings/affiliate";

function requiredMark() {
  return <span className="text-red-600"> *</span>;
}

export function RedirectRuleForm({ rule }: { rule?: RedirectRule }) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminRedirectRuleInput>({
    resolver: zodResolver(adminRedirectRuleSchema),
    defaultValues: rule
      ? {
          source: rule.source,
          destination: rule.destination,
          type: rule.type,
          isActive: rule.isActive,
        }
      : { source: "", destination: "", type: "PERMANENT", isActive: true },
  });

  async function onSubmit(data: AdminRedirectRuleInput) {
    try {
      const endpoint = rule ? `/api/admin/redirects/${rule.id}` : "/api/admin/redirects";
      const res = await fetch(endpoint, {
        method: rule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Failed to save redirect rule.";
        if (message.toLowerCase().includes("source")) {
          setError("source", { message });
        }
        toast.error(message);
        return;
      }
      toast.success(rule ? "Redirect rule updated." : "Redirect rule created.");
      router.push(BACK_HREF);
      router.refresh();
    } catch {
      toast.error("Failed to save redirect rule.");
    }
  }

  function handleBack() {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    router.push(BACK_HREF);
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="source" className="mb-1.5 block text-sm font-medium text-brand-950">
                Source path{requiredMark()}
              </label>
              <input
                id="source"
                placeholder="/old-page"
                className={fieldClassName}
                {...register("source")}
              />
              {errors.source && <p className="mt-1 text-xs text-red-600">{errors.source.message}</p>}
            </div>

            <div>
              <label htmlFor="destination" className="mb-1.5 block text-sm font-medium text-brand-950">
                Destination{requiredMark()}
              </label>
              <input
                id="destination"
                placeholder="/new-page"
                className={fieldClassName}
                {...register("destination")}
              />
              {errors.destination && (
                <p className="mt-1 text-xs text-red-600">{errors.destination.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-brand-950">
                Redirect type
              </label>
              <select id="type" className={fieldClassName} {...register("type")}>
                <option value="PERMANENT">308 Permanent</option>
                <option value="TEMPORARY">307 Temporary</option>
              </select>
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
                <input type="checkbox" className="h-4 w-4" {...register("isActive")} />
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
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
          <Button variant="primary" onClick={() => router.push(BACK_HREF)}>
            Discard changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
