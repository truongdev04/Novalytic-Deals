"use client";

import { cn } from "@/lib/utils";
import type { SecretFieldView } from "@/types";

const fieldClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-4 py-2.5 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

const sourceLabel: Record<SecretFieldView["source"], string> = {
  db: "Set in database",
  env: "Using environment variable",
  none: "Not configured",
};

const sourceClassName: Record<SecretFieldView["source"], string> = {
  db: "border-brand-300 bg-brand-50 text-brand-700",
  env: "border-muted-300 text-muted-600",
  none: "border-muted-300 text-muted-400",
};

export function SecretField({
  id,
  label,
  view,
  value,
  onChange,
  cleared,
  onToggleClear,
}: {
  id: string;
  label: string;
  view: SecretFieldView;
  value: string;
  onChange: (value: string) => void;
  cleared: boolean;
  onToggleClear: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-brand-950">
          {label}
        </label>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            sourceClassName[cleared ? "none" : view.source]
          )}
        >
          {cleared ? "Will be cleared" : sourceLabel[view.source]}
          {!cleared && view.maskedPreview ? ` (${view.maskedPreview})` : ""}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="password"
          placeholder="Enter a new value to replace it"
          className={fieldClassName}
          disabled={cleared}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {view.source === "db" && (
          <button
            type="button"
            onClick={onToggleClear}
            className={cn(
              "shrink-0 rounded-lg border px-3 text-xs font-medium transition-colors",
              cleared
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-muted-300 text-muted-600 hover:bg-surface-100"
            )}
          >
            {cleared ? "Undo" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}
