import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-300 bg-surface-0 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-muted-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-brand-950">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
