"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Tag, Ticket } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeRevealDialog } from "@/components/coupon/CodeRevealDialog";
import { consumePendingCodeReveal, setPendingCodeReveal } from "@/lib/utils";
import type { Deal, Store } from "@/types";

// Deal has no /go/[id] click-tracking route the way Coupon does — it opens
// the stored URL directly, both here and from inside the code dialog below.
function openDealLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Fire-and-forget click ping — feeds Deal.currentHourClicks, later rolled
// into the "Today's best deals" ranking (lib/content/dealsRefresh.ts).
// Doesn't block or change navigation UX at all.
function pingDealClick(dealId: string) {
  fetch(`/api/deals/${dealId}/click`, { method: "POST", keepalive: true }).catch(() => {});
}

export function DealProductCard({ deal, store }: { deal: Deal; store: Store }) {
  const [open, setOpen] = useState(false);
  const hasCode = deal.type === "CODE" && Boolean(deal.code);

  // A "Show Code" click in another tab left this id pending — this is that
  // duplicate tab, opened specifically to auto-reveal it (see handleTrigger).
  // setOpen is deferred to a microtask so it isn't called synchronously
  // within the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (hasCode && consumePendingCodeReveal(deal.id)) queueMicrotask(() => setOpen(true));
  }, [deal.id, hasCode]);

  // Image and CTA button trigger the exact same action. No code: jump
  // straight to the deal link. Has code: send the current tab straight to
  // the store and open a duplicate tab that auto-reveals the code there.
  function handleTrigger() {
    pingDealClick(deal.id);
    if (hasCode) {
      setPendingCodeReveal(deal.id);
      window.open(window.location.href, "_blank", "noopener,noreferrer");
      window.location.href = deal.url;
    } else {
      openDealLink(deal.url);
    }
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-muted-200 bg-surface-0 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={handleTrigger}
        aria-label={hasCode ? `Show code for ${deal.name}` : `Get deal for ${deal.name}`}
        className="flex aspect-4/3 w-full cursor-pointer items-center justify-center overflow-hidden bg-surface-0 pt-3 px-1.5 pb-1"
      >
        <Image
          src={deal.imageUrl}
          alt={deal.name}
          width={640}
          height={480}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-auto max-h-full w-auto max-w-full rounded-xl object-contain transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </button>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="flex items-center gap-1.5">
          <StoreLogo logoUrl={store.logoUrl} name={store.name} size="xs" />
          <span className="text-xs font-medium text-muted-700">{store.name}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {deal.offer && (
            <Badge variant="accent" className="rounded-xl px-2 py-0.5 text-xs text-red-600">
              {deal.offer}
            </Badge>
          )}
          {deal.type === "CODE" && (
            <Badge variant="brand" className="px-2 py-0.5 text-xs">
              <Tag className="h-3 w-3" />
              Code
            </Badge>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-heading text-lg font-bold text-brand-950">${deal.price}</span>
          {deal.originalPrice && (
            <span className="text-sm text-muted-400 line-through">${deal.originalPrice}</span>
          )}
        </div>

        <h3 className="mt-1 line-clamp-2 flex-1 text-sm font-semibold text-brand-950">
          {deal.name}
        </h3>

        <div className="mt-2.5">
          {hasCode ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full rounded-xl"
              onClick={handleTrigger}
            >
              <Ticket className="h-4 w-4" />
              Show Code
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="md"
              className="w-full rounded-xl"
              onClick={handleTrigger}
            >
              <ExternalLink className="h-4 w-4" />
              Get Deal
            </Button>
          )}
        </div>
      </div>

      {hasCode && (
        <CodeRevealDialog
          open={open}
          onOpenChange={setOpen}
          storeName={store.name}
          storeLogoUrl={store.logoUrl}
          valueLabel={deal.offer ?? "Special Offer"}
          subtitle={deal.name}
          code={deal.code!}
          ctaLabel={`Continue to ${store.name}`}
          onCtaClick={() => openDealLink(deal.url)}
        />
      )}
    </div>
  );
}
