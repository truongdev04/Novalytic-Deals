import Link from "next/link";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetNav({
  availableLetters,
  activeLetter,
  variant = "light",
  className,
}: {
  availableLetters: Set<string>;
  activeLetter?: string;
  variant?: "light" | "dark";
  className?: string;
}) {
  const items = [
    ...ALPHABET.map((letter) => ({ label: letter, href: `/stores/${letter}`, key: letter })),
    { label: "0-9", href: "/stores/0-9", key: "#" },
  ];

  const isDark = variant === "dark";

  return (
    <nav
      aria-label="Store index by letter"
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", className)}
    >
      {items.map(({ label, href, key }) => {
        const isAvailable = availableLetters.has(key);
        const isActive = key === activeLetter;

        if (isActive) {
          return (
            <Link
              key={key}
              href={href}
              aria-current="page"
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold",
                isDark ? "bg-white text-brand-700" : "bg-brand-600 text-white"
              )}
            >
              {label}
            </Link>
          );
        }

        if (!isAvailable) {
          return (
            <span
              key={key}
              aria-hidden="true"
              className={cn(
                "px-1 text-sm font-medium",
                isDark ? "text-white/30" : "text-muted-300"
              )}
            >
              {label}
            </span>
          );
        }

        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "px-1 text-sm font-medium transition-colors",
              isDark
                ? "text-white/90 hover:text-accent-300"
                : "text-brand-800 hover:text-brand-600"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
