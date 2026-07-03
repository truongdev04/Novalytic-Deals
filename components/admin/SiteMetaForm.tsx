"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { SiteMeta } from "@/lib/data/settings";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function SiteMetaForm({ meta }: { meta: SiteMeta | null }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SiteMeta>({
    defaultValues: meta ?? {
      title: "NovalyticDeals",
      description: "Verified coupons and deals for the US & Europe.",
      logoUrl: "",
      faviconUrl: "",
      ogImage: "",
    },
  });

  async function onSubmit(data: SiteMeta) {
    try {
      const res = await fetch("/api/admin/settings", {
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-brand-950">
          Site title
        </label>
        <input id="title" className={fieldClassName} {...register("title")} />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
          Site description
        </label>
        <textarea id="description" rows={3} className={fieldClassName} {...register("description")} />
      </div>
      <div>
        <label htmlFor="logoUrl" className="mb-1.5 block text-sm font-medium text-brand-950">
          Logo URL
        </label>
        <input id="logoUrl" className={fieldClassName} {...register("logoUrl")} />
      </div>
      <div>
        <label htmlFor="faviconUrl" className="mb-1.5 block text-sm font-medium text-brand-950">
          Favicon URL
        </label>
        <input id="faviconUrl" className={fieldClassName} {...register("faviconUrl")} />
      </div>
      <div>
        <label htmlFor="ogImage" className="mb-1.5 block text-sm font-medium text-brand-950">
          Default OG image URL
        </label>
        <input id="ogImage" className={fieldClassName} {...register("ogImage")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
