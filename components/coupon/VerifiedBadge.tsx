import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function VerifiedBadge({ className }: { className?: string } = {}) {
  return (
    <Badge variant="brand" className={className}>
      <BadgeCheck className="h-3.5 w-3.5" />
      Verified
    </Badge>
  );
}
