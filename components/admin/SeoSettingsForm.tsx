"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  adminSeoSettingsSchema,
  type AdminSeoSettingsInput,
} from "@/lib/validators/admin/settings";
import type { SeoSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function SeoSettingsForm({ settings }: { settings: SeoSettings }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AdminSeoSettingsInput>({
    resolver: zodResolver(adminSeoSettingsSchema),
    defaultValues: {
      titleTemplate: settings.titleTemplate ?? "",
      defaultMetaDescription: settings.defaultMetaDescription ?? "",
      defaultKeywords: settings.defaultKeywords ?? "",
      homepageTitle: settings.homepageTitle ?? "",
      homepageDescription: settings.homepageDescription ?? "",
    },
  });

  async function onSubmit(data: AdminSeoSettingsInput) {
    try {
      const res = await fetch("/api/admin/settings/seo", {
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
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full space-y-5 md:w-4/5">
      <div className="space-y-4 rounded-lg border border-muted-200 p-4">
        <h3 className="font-heading text-sm font-semibold text-brand-950">
          Homepage / brand search
        </h3>
        <p className="text-xs text-muted-500">
          What Google literally shows when someone searches your brand name — separate from the
          Title/Description used elsewhere on the site.
        </p>
        <div>
          <label htmlFor="homepageTitle" className="mb-1.5 block text-sm font-medium text-brand-950">
            Homepage title
          </label>
          <input
            id="homepageTitle"
            placeholder="NovalyticDeals — Verified Coupon Codes & Exclusive Deals"
            className={fieldClassName}
            {...register("homepageTitle")}
          />
        </div>
        <div>
          <label
            htmlFor="homepageDescription"
            className="mb-1.5 block text-sm font-medium text-brand-950"
          >
            Homepage description
          </label>
          <textarea
            id="homepageDescription"
            rows={3}
            className={fieldClassName}
            {...register("homepageDescription")}
          />
        </div>
      </div>
      <div>
        <label htmlFor="titleTemplate" className="mb-1.5 block text-sm font-medium text-brand-950">
          Title template
        </label>
        <input
          id="titleTemplate"
          className={fieldClassName}
          placeholder="%s | NovalyticDeals"
          {...register("titleTemplate")}
        />
        <p className="mt-1 text-xs text-muted-500">
          Use <code>%s</code> as a placeholder for each page&apos;s own title.
        </p>
      </div>
      <div>
        <label
          htmlFor="defaultMetaDescription"
          className="mb-1.5 block text-sm font-medium text-brand-950"
        >
          Default meta description
        </label>
        <textarea
          id="defaultMetaDescription"
          rows={3}
          className={fieldClassName}
          {...register("defaultMetaDescription")}
        />
        <p className="mt-1 text-xs text-muted-500">
          Used as a fallback when a page doesn&apos;t set its own description.
        </p>
      </div>
      <div>
        <label
          htmlFor="defaultKeywords"
          className="mb-1.5 block text-sm font-medium text-brand-950"
        >
          Default keywords
        </label>
        <input
          id="defaultKeywords"
          className={fieldClassName}
          placeholder="coupons, deals, promo codes"
          {...register("defaultKeywords")}
        />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
