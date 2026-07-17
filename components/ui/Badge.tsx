import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-700",
        accent: "bg-accent-50 text-accent-700",
        muted: "bg-muted-100 text-muted-700",
        outline: "border border-muted-300 text-muted-700",
        solid: "bg-brand-600 text-white",
      },
    },
    defaultVariants: { variant: "brand" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
