"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { SecretField } from "@/components/admin/SecretField";
import {
  adminIntegrationsSettingsSchema,
  type AdminIntegrationsSettingsInput,
} from "@/lib/validators/admin/settings";
import type { IntegrationsSettingsView } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

type NonSecretFields = Pick<
  AdminIntegrationsSettingsInput,
  "contactInboxEmail" | "gaId" | "plausibleDomain"
>;

export function IntegrationsSettingsForm({ view }: { view: IntegrationsSettingsView }) {
  const router = useRouter();
  const [resendApiKey, setResendApiKey] = useState("");
  const [turnstileSecretKey, setTurnstileSecretKey] = useState("");
  const [clearFields, setClearFields] = useState<Set<"resendApiKey" | "turnstileSecretKey">>(
    new Set()
  );

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<NonSecretFields>({
    resolver: zodResolver(adminIntegrationsSettingsSchema.pick({
      contactInboxEmail: true,
      gaId: true,
      plausibleDomain: true,
    })),
    defaultValues: {
      contactInboxEmail: view.contactInboxEmail ?? "",
      gaId: view.gaId ?? "",
      plausibleDomain: view.plausibleDomain ?? "",
    },
  });

  function toggleClear(field: "resendApiKey" | "turnstileSecretKey") {
    setClearFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  async function onSubmit(data: NonSecretFields) {
    try {
      const payload: AdminIntegrationsSettingsInput = {
        ...data,
        resendApiKey: resendApiKey || undefined,
        turnstileSecretKey: turnstileSecretKey || undefined,
        clearFields: Array.from(clearFields),
      };
      const res = await fetch("/api/admin/settings/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Settings saved.");
      setResendApiKey("");
      setTurnstileSecretKey("");
      setClearFields(new Set());
      router.refresh();
    } catch {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full space-y-5 md:w-4/5">
      <SecretField
        id="resendApiKey"
        label="Resend API key"
        view={view.resendApiKey}
        value={resendApiKey}
        onChange={setResendApiKey}
        cleared={clearFields.has("resendApiKey")}
        onToggleClear={() => toggleClear("resendApiKey")}
      />

      <div>
        <label htmlFor="contactInboxEmail" className="mb-1.5 block text-sm font-medium text-brand-950">
          Contact inbox &quot;from&quot; email
        </label>
        <input id="contactInboxEmail" className={fieldClassName} {...register("contactInboxEmail")} />
      </div>

      <div className="border-t border-muted-200 pt-5">
        <SecretField
          id="turnstileSecretKey"
          label="Turnstile secret key"
          view={view.turnstileSecretKey}
          value={turnstileSecretKey}
          onChange={setTurnstileSecretKey}
          cleared={clearFields.has("turnstileSecretKey")}
          onToggleClear={() => toggleClear("turnstileSecretKey")}
        />
        <p className="mt-2 text-xs text-muted-500">
          Turnstile site key is public and configured via <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>{" "}
          in the environment
          {view.turnstileSiteKey ? ` (currently: ${view.turnstileSiteKey})` : " (not set)"}.
        </p>
      </div>

      <div className="border-t border-muted-200 pt-5">
        <div>
          <label htmlFor="gaId" className="mb-1.5 block text-sm font-medium text-brand-950">
            Google Analytics ID
          </label>
          <input id="gaId" placeholder="G-XXXXXXXXXX" className={fieldClassName} {...register("gaId")} />
        </div>
        <div className="mt-4">
          <label htmlFor="plausibleDomain" className="mb-1.5 block text-sm font-medium text-brand-950">
            Plausible domain
          </label>
          <input id="plausibleDomain" className={fieldClassName} {...register("plausibleDomain")} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
