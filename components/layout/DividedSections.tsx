import { cn } from "@/lib/utils";

/**
 * Stacks content sections with a horizontal rule between each one. Inter-section
 * vertical padding is built in; the first and last sections sit flush so the
 * caller controls the outer spacing. The rule spans the full width of whatever
 * container this is dropped into.
 */
export function DividedSections({
  children,
  className,
  spacing = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  spacing?: "normal" | "loose";
}) {
  return (
    <div
      className={cn(
        "divide-y divide-muted-200 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0",
        spacing === "loose" ? "[&>*]:py-20" : "[&>*]:py-14",
        className
      )}
    >
      {children}
    </div>
  );
}
