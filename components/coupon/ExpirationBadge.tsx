import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatExpiration, isExpired, isExpiringSoon } from "@/lib/utils";

export function ExpirationBadge({ expiresAt }: { expiresAt?: string }) {
  const expired = isExpired(expiresAt);
  const urgent = !expired && isExpiringSoon(expiresAt);

  return (
    <Badge
      variant={urgent ? "accent" : "muted"}
      className={cn(expired && "text-muted-400")}
    >
      <Clock className="h-3.5 w-3.5" />
      {formatExpiration(expiresAt)}
    </Badge>
  );
}
