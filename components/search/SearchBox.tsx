import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBox({
  defaultValue = "",
  placeholder = "Search stores, coupons...",
  action = "/search",
  className,
  inputClassName,
  listId,
}: {
  defaultValue?: string;
  placeholder?: string;
  action?: string;
  className?: string;
  inputClassName?: string;
  listId?: string;
}) {
  return (
    <form action={action} method="GET" role="search" className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        list={listId}
        aria-label="Search stores and coupons"
        className={cn(
          "h-11 w-full rounded-full border border-muted-300 bg-surface-0 pl-10 pr-4 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          inputClassName
        )}
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
