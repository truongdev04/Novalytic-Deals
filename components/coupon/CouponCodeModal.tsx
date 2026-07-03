"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Ticket } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CopyCodeButton } from "@/components/coupon/CopyCodeButton";
import { toast } from "@/components/ui/Toast";
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
}: {
  coupon: Coupon;
  store: Store;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const hasCode = Boolean(coupon.code);

  useEffect(() => {
    if (open && coupon.code) {
      navigator.clipboard.writeText(coupon.code).catch(() => {});
      toast.success("Code copied to clipboard!");
      revealCoupon(coupon.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!hasCode) {
    return (
      <Button
        type="button"
        variant="accent"
        size={size}
        onClick={() => openGoLink(coupon.id)}
      >
        <ExternalLink className="h-4 w-4" />
        Get Deal
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="primary" size={size} onClick={() => setOpen(true)}>
        <Ticket className="h-4 w-4" />
        Show Code
      </Button>

      <Modal open={open} onOpenChange={setOpen} title={`${store.name} coupon code`}>
        <p className="text-sm text-muted-600">{coupon.title}</p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3">
          <span className="font-mono text-lg font-semibold tracking-wide text-brand-900">
            {coupon.code}
          </span>
          <CopyCodeButton code={coupon.code!} />
        </div>

        <p className="mt-3 text-xs text-muted-500">{coupon.terms}</p>

        <Button
          type="button"
          variant="accent"
          className="mt-5 w-full"
          onClick={() => openGoLink(coupon.id)}
        >
          <ExternalLink className="h-4 w-4" />
          Continue to {store.name}
        </Button>
      </Modal>
    </>
  );
}
