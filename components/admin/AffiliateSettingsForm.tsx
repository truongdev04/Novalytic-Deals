"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  adminAffiliateSettingsSchema,
  type AdminAffiliateSettingsInput,
} from "@/lib/validators/admin/settings";
import type { AffiliateSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function AffiliateSettingsForm({
  settings,
  effectiveDefaultAffiliateNetwork,
}: {
  settings: AffiliateSettings;
  effectiveDefaultAffiliateNetwork?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AdminAffiliateSettingsInput>({
    resolver: zodResolver(adminAffiliateSettingsSchema),
    defaultValues: { defaultAffiliateNetwork: settings.defaultAffiliateNetwork ?? "" },
  });

  async function onSubmit(data: AdminAffiliateSettingsInput) {
    try {
      const res = await fetch("/api/admin/settings/affiliate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Settings saved.");
    } catch {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-2">
      <div>
        <label
          htmlFor="defaultAffiliateNetwork"
          className="mb-1.5 block text-sm font-medium text-brand-950"
        >
          Default affiliate network
        </label>
        <input
          id="defaultAffiliateNetwork"
          className={fieldClassName}
          {...register("defaultAffiliateNetwork")}
        />
        {!settings.defaultAffiliateNetwork && (
          <p className="mt-1 text-xs text-muted-500">
            Falls back to environment default:{" "}
            {effectiveDefaultAffiliateNetwork ? effectiveDefaultAffiliateNetwork : "not set"}
          </p>
        )}
      </div>
      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
