"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { CouponCard } from "@/components/coupon/CouponCard";
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
    case "codes":
      return coupons.filter((c) => c.type === "CODE");
    case "deals":
      return coupons.filter((c) => c.type !== "CODE");
    default:
      return coupons;
  }
}

export function StoreCouponTabs({ coupons, store }: { coupons: Coupon[]; store: Store }) {
  return (
    <Tabs.Root defaultValue="all">
      <Tabs.List className="mb-6 flex w-fit gap-1 rounded-full bg-surface-100 p-1">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-muted-600 transition-colors",
              "data-[state=active]:bg-brand-600 data-[state=active]:text-white"
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((tab) => {
        const filtered = filterCoupons(coupons, tab.value);
        return (
          <Tabs.Content key={tab.value} value={tab.value} className="space-y-4">
            {filtered.length === 0 ? (
              <EmptyState
                title="No coupons in this category"
                description="Check back soon or browse all offers from this store."
              />
            ) : (
              filtered.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} store={store} />
              ))
            )}
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}
