"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { StoreCouponCard } from "@/components/coupon/StoreCouponCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Coupon, Store } from "@/types";

const tabs = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "codes", label: "Codes" },
  { value: "deals", label: "Deals" },
];

function filterCoupons(coupons: Coupon[], tab: string) {
  switch (tab) {
    case "verified":
      return coupons.filter((c) => c.verified);
    // Matches the "Show Code" vs "Get Deal" button split in CouponCodeModal
    // (Boolean(coupon.code)), not `coupon.type` — a FREESHIP/DEAL coupon
    // that still carries a real code belongs under "Codes", not "Deals".
    case "codes":
      return coupons.filter((c) => Boolean(c.code));
    case "deals":
      return coupons.filter((c) => !c.code);
    default:
      return coupons;
  }
}

// Display priority: exclusive first, then any coupon with a real code,
// everything else (plain deals) last.
function couponRank(coupon: Coupon): number {
  if (coupon.exclusive) return 0;
  if (coupon.code) return 1;
  return 2;
}

function sortByPriority(coupons: Coupon[]): Coupon[] {
  return [...coupons].sort((a, b) => couponRank(a) - couponRank(b));
}

export function StoreCouponTabs({ coupons, store }: { coupons: Coupon[]; store: Store }) {
  return (
    <Tabs.Root defaultValue="all">
      <Tabs.List className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-surface-100 p-1 sm:w-fit">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "shrink-0 rounded-xl px-6 py-1.5 text-sm font-medium text-muted-600 transition-colors",
              "data-[state=active]:bg-brand-600 data-[state=active]:text-white"
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((tab) => {
        const filtered = sortByPriority(filterCoupons(coupons, tab.value));
        return (
          <Tabs.Content
            key={tab.value}
            value={tab.value}
            className="grid grid-cols-2 gap-4 sm:grid-cols-1"
          >
            {filtered.length === 0 ? (
              <div className="col-span-2 sm:col-span-1">
                <EmptyState
                  title="No coupons in this category"
                  description="Check back soon or browse all offers from this store."
                />
              </div>
            ) : (
              filtered.map((coupon, index) => (
                <StoreCouponCard
                  key={coupon.id}
                  coupon={coupon}
                  store={store}
                  isTopPick={index === 0 && (coupon.exclusive || Boolean(coupon.code))}
                />
              ))
            )}
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}
