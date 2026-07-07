"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { ImageUploadField, type StorageProvider } from "@/components/admin/ImageUploadField";
import {
  adminGeneralSettingsSchema,
  type AdminGeneralSettingsInput,
} from "@/lib/validators/admin/settings";
import type { GeneralSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

export function GeneralSettingsForm({ settings }: { settings: GeneralSettings }) {
  const router = useRouter();
  // Bumped after every successful save to force the three ImageUploadFields
  // to remount — otherwise each one keeps showing its own internal blob:
  // preview from the last picked file instead of the freshly uploaded URL,
  // since only remounting resets that internal state.
  const [imagesVersion, setImagesVersion] = useState(0);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoProvider, setPendingLogoProvider] = useState<StorageProvider>("cloudinary");
  const [pendingFaviconFile, setPendingFaviconFile] = useState<File | null>(null);
  const [pendingFaviconProvider, setPendingFaviconProvider] = useState<StorageProvider>("cloudinary");
  const [pendingOgImageFile, setPendingOgImageFile] = useState<File | null>(null);
  const [pendingOgImageProvider, setPendingOgImageProvider] = useState<StorageProvider>("cloudinary");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminGeneralSettingsInput>({
    resolver: zodResolver(adminGeneralSettingsSchema),
    defaultValues: settings,
  });

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

  async function onSubmit(data: AdminGeneralSettingsInput) {
    try {
      const [logoUrl, faviconUrl, ogImage] = await Promise.all([
        pendingLogoFile
          ? uploadPendingImage(pendingLogoFile, pendingLogoProvider)
          : Promise.resolve(data.logoUrl),
        pendingFaviconFile
          ? uploadPendingImage(pendingFaviconFile, pendingFaviconProvider)
          : Promise.resolve(data.faviconUrl),
        pendingOgImageFile
          ? uploadPendingImage(pendingOgImageFile, pendingOgImageProvider)
          : Promise.resolve(data.ogImage),
      ]);

      const res = await fetch("/api/admin/settings/general", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, logoUrl, faviconUrl, ogImage }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data) throw new Error("save failed");

      // Reset the form to the values the server actually persisted (real
      // uploaded URLs, not the local blob: preview), and clear the pending
      // file state now that it's been uploaded.
      reset(body.data);
      setPendingLogoFile(null);
      setPendingFaviconFile(null);
      setPendingOgImageFile(null);
      setImagesVersion((v) => v + 1);

      toast.success("Settings saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full space-y-5 md:w-4/5">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-brand-950">
          Site title
        </label>
        <input id="title" className={fieldClassName} {...register("title")} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-brand-950">
          Site description
        </label>
        <textarea id="description" rows={3} className={fieldClassName} {...register("description")} />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Controller
          key={`logo-${imagesVersion}`}
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <ImageUploadField
              label="Logo"
              value={field.value ?? ""}
              onChange={field.onChange}
              aspectClassName="aspect-square w-24"
              allowManualUrl
              deferUpload
              onFileSelected={(file, provider) => {
                setPendingLogoFile(file);
                setPendingLogoProvider(provider);
              }}
            />
          )}
        />
        <Controller
          key={`favicon-${imagesVersion}`}
          control={control}
          name="faviconUrl"
          render={({ field }) => (
            <ImageUploadField
              label="Favicon"
              value={field.value ?? ""}
              onChange={field.onChange}
              aspectClassName="aspect-square w-16"
              allowManualUrl
              deferUpload
              onFileSelected={(file, provider) => {
                setPendingFaviconFile(file);
                setPendingFaviconProvider(provider);
              }}
            />
          )}
        />
        <Controller
          key={`ogImage-${imagesVersion}`}
          control={control}
          name="ogImage"
          render={({ field }) => (
            <ImageUploadField
              label="Default OG image"
              value={field.value ?? ""}
              onChange={field.onChange}
              aspectClassName="aspect-video w-40"
              allowManualUrl
              deferUpload
              onFileSelected={(file, provider) => {
                setPendingOgImageFile(file);
                setPendingOgImageProvider(provider);
              }}
            />
          )}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-muted-200 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
          <input type="checkbox" className="h-4 w-4" {...register("robotsIndexingEnabled")} />
          Allow search engines to index the site (robots.txt)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-brand-950">
          <input type="checkbox" className="h-4 w-4" {...register("sitemapEnabled")} />
          Publish sitemap.xml
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
