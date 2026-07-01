import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted-100", className)}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-muted-200 bg-surface-0 p-4 shadow-sm">
      <LoadingSkeleton className="mb-4 h-12 w-12 rounded-lg" />
      <LoadingSkeleton className="mb-2 h-4 w-3/4" />
      <LoadingSkeleton className="h-3 w-1/2" />
    </div>
  );
}
