"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Tag, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useCouponVote } from "@/lib/hooks/useCouponVote";

export interface CodeRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  storeLogoUrl: string;
  valueLabel: string;
  subtitle: string;
  code: string;
  terms?: string;
  ctaLabel: string;
  onCtaClick: () => void;
  vote?: { couponId: string; upvotes: number; downvotes: number };
}

// New layout (avatar, copied bubble, code pill, Yes/No) recolored to the
// site's standard light palette to stay consistent with the rest of the UI.
// Deliberately independent of components/ui/Modal.tsx — the header/title row
// convention there doesn't fit this centered, avatar-first layout.
export function CodeRevealDialog({
  open,
  onOpenChange,
  storeName,
  storeLogoUrl,
  valueLabel,
  subtitle,
  code,
  terms,
  ctaLabel,
  onCtaClick,
  vote,
}: CodeRevealDialogProps) {
  const [justCopied, setJustCopied] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const { choice, vote: castVote } = useCouponVote(vote?.couponId ?? "", {
    up: vote?.upvotes ?? 0,
    down: vote?.downvotes ?? 0,
  });

  // Mirrors the `open` prop transition to flip the "copied" bubble the
  // instant the dialog opens — adjusting state during render (not inside a
  // useEffect body) per https://react.dev/learn/you-might-not-need-an-effect.
  if (open !== prevOpen) {
    setPrevOpen(open);
    setJustCopied(open);
  }

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {});
    setJustCopied(true);
  }

  useEffect(() => {
    if (open) navigator.clipboard.writeText(code).catch(() => {});
  }, [open, code]);

  useEffect(() => {
    if (!justCopied) return;
    const timer = setTimeout(() => setJustCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [justCopied]);

  // No terms/vote section means the code pill and CTA would otherwise sit
  // right on top of each other — give them more breathing room in that case.
  const ctaSpacing = !terms && !vote ? "mt-10" : "mt-6";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-950/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-0 p-8 text-center shadow-lg focus:outline-none data-[state=open]:animate-fade-up">
          <Dialog.Title className="sr-only">{storeName} code</Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-500 hover:bg-surface-100 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          <div className="flex flex-col items-center">
            <StoreLogo
              logoUrl={storeLogoUrl}
              name={storeName}
              size="xl"
              className="rounded-full"
            />

            <h2 className="mt-4 text-3xl font-bold text-brand-950">{valueLabel}</h2>
            <p className="mt-1 text-sm text-muted-600">{subtitle}</p>

            <div className="relative mt-10 flex w-full justify-center">
              <div
                className={cn(
                  "absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-medium text-white shadow-md transition-opacity duration-200",
                  justCopied ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                Copied to your clipboard!
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-brand-900" />
              </div>

              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-muted-200 bg-surface-50 py-2 pl-4 pr-2">
                <span className="flex min-w-0 items-center gap-2 truncate font-mono text-base font-bold tracking-wide text-brand-700">
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="truncate">{code}</span>
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="shrink-0 rounded-full bg-surface-100 px-3 py-1.5 text-xs font-semibold text-brand-900 transition-colors hover:bg-muted-200"
                >
                  {justCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {terms && <p className="mt-3 text-xs text-muted-500">{terms}</p>}

            {vote && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <p className="text-sm text-muted-600">Did this code work?</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => castVote("down")}
                    aria-pressed={choice === "down"}
                    aria-label="No, this code didn't work"
                    disabled={Boolean(choice)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                      choice === "down"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-muted-300 text-muted-600 hover:bg-surface-100"
                    )}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => castVote("up")}
                    aria-pressed={choice === "up"}
                    aria-label="Yes, this code worked"
                    disabled={Boolean(choice)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                      choice === "up"
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-muted-300 text-muted-600 hover:bg-surface-100"
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </button>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="accent"
              className={cn("w-full rounded-xl", ctaSpacing)}
              onClick={onCtaClick}
            >
              <ExternalLink className="h-4 w-4" />
              {ctaLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
