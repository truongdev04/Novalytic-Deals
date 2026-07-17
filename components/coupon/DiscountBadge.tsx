import { Badge } from "@/components/ui/Badge";
import { formatDiscount } from "@/lib/utils";
import type { Coupon } from "@/types";

export function DiscountBadge({ coupon, className }: { coupon: Coupon; className?: string }) {
  return (
    <Badge variant="accent" className={className}>
      {formatDiscount(coupon.type, coupon.discountType, coupon.discountValue, coupon.currency)}
    </Badge>
  );
}
