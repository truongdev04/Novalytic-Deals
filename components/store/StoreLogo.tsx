import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 40,
  md: 56,
  lg: 88,
};

export function StoreLogo({
  logoUrl,
  name,
  size = "md",
  className,
}: {
  logoUrl: string;
  name: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const px = sizeMap[size];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-muted-200 bg-surface-0",
        className
      )}
      style={{ width: px, height: px }}
    >
      <Image src={logoUrl} alt={`${name} logo`} width={px} height={px} />
    </span>
  );
}
