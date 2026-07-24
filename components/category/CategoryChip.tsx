import { Link } from "next-view-transitions";
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
      scroll={false}
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
