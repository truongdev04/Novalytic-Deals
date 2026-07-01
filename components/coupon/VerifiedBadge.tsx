import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function VerifiedBadge() {
  return (
    <Badge variant="brand">
      <BadgeCheck className="h-3.5 w-3.5" />
      Verified
    </Badge>
  );
}
