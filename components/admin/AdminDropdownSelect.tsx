"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

type DropdownValue = string | boolean | null;

export interface DropdownOption {
  value: DropdownValue;
  label: string;
}

export function AdminDropdownSelect({
  endpoint,
  field,
  value,
  options,
  badgeClassName,
  triggerClassName,
}: {
  endpoint: string;
  field: string;
  value: DropdownValue;
  options: DropdownOption[];
  badgeClassName?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function selectOption(next: DropdownValue) {
    setOpen(false);
    if (next === value) return;
    setIsPending(true);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error("update failed");
      router.refresh();
    } catch {
      toast.error("Failed to update.");
    } finally {
      setIsPending(false);
    }
  }

  const current = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className={cn(
          "flex items-center justify-between gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
          triggerClassName ?? "w-auto",
          badgeClassName ?? "border-muted-300 text-muted-600 hover:bg-surface-100"
        )}
      >
        <span className="truncate">{current?.label ?? "—"}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 max-h-56 min-w-[10rem] overflow-y-auto rounded-lg border border-muted-200 bg-surface-0 py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => selectOption(opt.value)}
              className={cn(
                "block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs hover:bg-surface-100",
                opt.value === value ? "font-semibold text-brand-700" : "text-muted-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
