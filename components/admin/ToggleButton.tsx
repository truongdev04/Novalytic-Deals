"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

export function ToggleButton({
  endpoint,
  field,
  value,
  label,
}: {
  endpoint: string;
  field: string;
  value: boolean;
  label: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onToggle() {
    setIsPending(true);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !value }),
      });
      if (!res.ok) throw new Error("toggle failed");
      router.refresh();
    } catch {
      toast.error("Failed to update.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        value
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-muted-300 text-muted-500 hover:bg-surface-100"
      )}
    >
      {label}
    </button>
  );
}
