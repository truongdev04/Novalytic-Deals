import Image from "next/image";
import { cn } from "@/lib/utils";

// Shared rounded-card hero used across the home page and the top-level
// landing pages (stores, deals, categories, event pages). The page passes
// its own heading / copy / search field as children; this component only
// owns the card shell, background image, and centered column.
export function PageHero({
  imageSrc = "/images/hero/home-hero.svg",
  contentClassName,
  children,
}: {
  imageSrc?: string | null;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-brand-900">
        {imageSrc ? (
          <Image src={imageSrc} alt="" fill priority className="object-cover" />
        ) : null}
        <div
          className={cn(
            "relative flex min-h-[360px] flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[420px] sm:px-6 sm:py-16",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
