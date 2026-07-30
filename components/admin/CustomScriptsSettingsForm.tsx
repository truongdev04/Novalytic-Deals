"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "nextjs-toploader/app";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  adminCustomScriptsSettingsSchema,
  type AdminCustomScriptsSettingsInput,
} from "@/lib/validators/admin/settings";
import type { CustomScriptsSettings } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 font-mono text-xs text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[160px] resize-y";

export function CustomScriptsSettingsForm({ settings }: { settings: CustomScriptsSettings }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AdminCustomScriptsSettingsInput>({
    resolver: zodResolver(adminCustomScriptsSettingsSchema),
    defaultValues: {
      headScript: settings.headScript ?? "",
      bodyScript: settings.bodyScript ?? "",
      footerScript: settings.footerScript ?? "",
    },
  });

  async function onSubmit(data: AdminCustomScriptsSettingsInput) {
    try {
      const res = await fetch("/api/admin/settings/scripts", {
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
      <div className="space-y-2 rounded-lg border border-muted-200 p-4">
        <h3 className="font-heading text-sm font-semibold text-brand-950">Head Script</h3>
        <p className="text-xs text-muted-500">
          JavaScript only — paste the exact <code>&lt;script&gt;...&lt;/script&gt;</code> snippet
          copied from Google Analytics, GTM, Facebook Pixel, etc. Rendered in the real{" "}
          <code>&lt;head&gt;</code>, before the page becomes interactive. Non-script tags (e.g.{" "}
          <code>&lt;meta&gt;</code>) are ignored here — use Body Script for those instead.
        </p>
        <textarea
          id="headScript"
          spellCheck={false}
          className={fieldClassName}
          {...register("headScript")}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-muted-200 p-4">
        <h3 className="font-heading text-sm font-semibold text-brand-950">Body Script</h3>
        <p className="text-xs text-muted-500">
          Any HTML, inserted immediately after <code>&lt;body&gt;</code> opens — e.g. the{" "}
          <code>&lt;noscript&gt;</code> fallback from Google Tag Manager, or other markup that
          needs to appear early.
        </p>
        <textarea
          id="bodyScript"
          spellCheck={false}
          className={fieldClassName}
          {...register("bodyScript")}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-muted-200 p-4">
        <h3 className="font-heading text-sm font-semibold text-brand-950">Footer Script</h3>
        <p className="text-xs text-muted-500">
          Any HTML, inserted right before <code>&lt;/body&gt;</code> closes — good for chat
          widgets or scripts that don&apos;t need to run immediately.
        </p>
        <textarea
          id="footerScript"
          spellCheck={false}
          className={fieldClassName}
          {...register("footerScript")}
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
