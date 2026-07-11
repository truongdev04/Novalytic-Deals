"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  adminSocialSettingsSchema,
  type AdminSocialSettingsInput,
} from "@/lib/validators/admin/settings";
import type { SocialSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const fields: { name: keyof AdminSocialSettingsInput; label: string; placeholder: string }[] = [
  { name: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { name: "tiktokUrl", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { name: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { name: "xUrl", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { name: "youtubeUrl", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
];

export function SocialSettingsForm({ settings }: { settings: SocialSettings }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminSocialSettingsInput>({
    resolver: zodResolver(adminSocialSettingsSchema),
    defaultValues: {
      facebookUrl: settings.facebookUrl ?? "",
      tiktokUrl: settings.tiktokUrl ?? "",
      instagramUrl: settings.instagramUrl ?? "",
      xUrl: settings.xUrl ?? "",
      youtubeUrl: settings.youtubeUrl ?? "",
    },
  });

  async function onSubmit(data: AdminSocialSettingsInput) {
    try {
      const res = await fetch("/api/admin/settings/social", {
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
      {fields.map(({ name, label, placeholder }) => (
        <div key={name}>
          <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-brand-950">
            {label}
          </label>
          <input
            id={name}
            className={fieldClassName}
            placeholder={placeholder}
            {...register(name)}
          />
          {errors[name] && (
            <p className="mt-1 text-xs text-red-600">{errors[name]?.message as string}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-500">
        Leave a field blank to hide that icon in the footer.
      </p>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
