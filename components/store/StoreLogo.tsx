import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: 24,
  sm: 40,
  md: 56,
  lg: 88,
  xl: 112,
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
      {logoUrl ? (
        <Image src={logoUrl} alt={`${name} logo`} width={px} height={px} />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center bg-brand-50 font-heading font-semibold text-brand-600"
          style={{ fontSize: px / 2.5 }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
