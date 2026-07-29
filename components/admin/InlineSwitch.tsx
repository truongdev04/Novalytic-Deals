import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

interface InlineSwitchProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  label: string;
}

// Plain presentational on/off switch styled as a checkbox — no network
// calls, meant to live inside an uncommitted react-hook-form form (unlike
// ToggleButton, which fires its own PATCH immediately on click).
export function InlineSwitch({ label, className, ...props }: InlineSwitchProps) {
  return (
    <label className={cn("flex items-center gap-2 text-xs text-muted-600", className)}>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full bg-muted-300 transition-colors peer-checked:bg-brand-600" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      {label}
    </label>
  );
}
