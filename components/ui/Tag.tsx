import { cn } from "@/lib/utils";

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-muted-700",
        className
      )}
    >
      {children}
    </span>
  );
}
