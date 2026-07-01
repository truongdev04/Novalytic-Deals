import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 16,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              i < Math.round(value)
                ? "fill-accent-400 text-accent-400"
                : "fill-muted-200 text-muted-200"
            }
          />
        ))}
      </div>
      <span className="text-sm font-medium text-muted-700">
        {value.toFixed(1)}
        {typeof count === "number" && (
          <span className="text-muted-500"> ({count.toLocaleString()})</span>
        )}
      </span>
      <span className="sr-only">{value.toFixed(1)} out of 5 stars</span>
    </div>
  );
}
