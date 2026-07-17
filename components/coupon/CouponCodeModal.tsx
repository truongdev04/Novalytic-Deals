"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Check, Copy, ExternalLink, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CodeRevealDialog } from "@/components/coupon/CodeRevealDialog";
import { cn, consumePendingCodeReveal, formatDiscount, setPendingCodeReveal } from "@/lib/utils";
import type { Coupon, Store } from "@/types";

// The real affiliateUrl is never exposed here — /go/[couponId] resolves it
// server-side, logs the click, and 302s. Opening it also fires a reveal POST
// so usage/vote-adjacent stats stay accurate.
function openGoLink(couponId: string) {
  window.open(`/go/${couponId}`, "_blank", "noopener,noreferrer");
}

function revealCoupon(couponId: string) {
  fetch(`/api/coupons/${couponId}/reveal`, { method: "POST" }).catch(() => {});
}

export function CouponCodeModal({
  coupon,
  store,
  size = "md",
  className,
  newTabHref,
}: {
  coupon: Coupon;
  store: Store;
  size?: "sm" | "md";
  className?: string;
  /**
   * URL the sister tab opened by "Show Code" should navigate to, instead of
   * duplicating the current page. Listing pages that embed many stores'
   * coupons (e.g. home sections) pass the coupon's own `/store/[slug]` here
   * so that tab lands on the right store instead of duplicating the listing.
   */
  newTabHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const hasCode = Boolean(coupon.code);

  useEffect(() => {
    if (open) {
      revealCoupon(coupon.id);
      queueMicrotask(() => setRevealed(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A "Show Code" click in another tab left this id pending — this is that
  // duplicate tab, opened specifically to auto-reveal it (see handleShowCode).
  // setOpen is deferred to a microtask so it isn't called synchronously
  // within the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (consumePendingCodeReveal(coupon.id)) queueMicrotask(() => setOpen(true));
  }, [coupon.id]);

  // "Show Code" sends the current tab straight to the store and opens a
  // duplicate tab that auto-reveals the code there instead (matches how
  // simplycodes.com-style sites behave: shop in one tab, code in the other).
  function handleShowCode() {
    setPendingCodeReveal(coupon.id);
    window.open(newTabHref ?? window.location.href, "_blank", "noopener,noreferrer");
    window.location.href = `/go/${coupon.id}`;
  }

  function handleCopy(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    navigator.clipboard.writeText(coupon.code!).catch(() => {});
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }

  if (!hasCode) {
    return (
      <Button
        type="button"
        variant="accent"
        size={size}
        className={cn("rounded-xl", className)}
        onClick={() => openGoLink(coupon.id)}
      >
        <ExternalLink className="h-4 w-4" />
        Get Deal
      </Button>
    );
  }

  return (
    <>
      {revealed ? (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 pl-3 pr-1.5",
            size === "sm" ? "h-9" : "h-11",
            className
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            <Ticket className="h-4 w-4 shrink-0 text-brand-700" />
            <span className="truncate font-mono text-sm font-bold text-brand-700">
              {coupon.code}
            </span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {justCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {justCopied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="primary"
          size={size}
          className={cn("rounded-xl", className)}
          onClick={handleShowCode}
        >
          <Ticket className="h-4 w-4" />
          Show Code
        </Button>
      )}

      <CodeRevealDialog
        open={open}
        onOpenChange={setOpen}
        storeName={store.name}
        storeLogoUrl={store.logoUrl}
        valueLabel={formatDiscount(
          coupon.type,
          coupon.discountType,
          coupon.discountValue,
          coupon.currency
        )}
        subtitle={coupon.title}
        code={coupon.code!}
        terms={coupon.terms}
        ctaLabel={`Continue to ${store.name}`}
        onCtaClick={() => openGoLink(coupon.id)}
        vote={{ couponId: coupon.id, upvotes: coupon.upvotes, downvotes: coupon.downvotes }}
      />
    </>
  );
}
