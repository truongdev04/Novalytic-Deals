import { Badge } from "@/components/ui/Badge";
import { formatDiscount } from "@/lib/utils";
import type { Coupon } from "@/types";

export function DiscountBadge({ coupon }: { coupon: Coupon }) {
  return (
    <Badge variant="accent">
      {formatDiscount(coupon.type, coupon.discountType, coupon.discountValue, coupon.currency)}
    </Badge>
  );
}
