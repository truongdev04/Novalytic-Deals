import Link from "next/link";
import { cn } from "@/lib/utils";

export function CategoryChip({
  name,
  href,
  active,
}: {
  name: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-muted-300 text-muted-700 hover:bg-surface-100"
      )}
    >
      {name}
    </Link>
  );
}
