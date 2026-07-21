"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreCard } from "@/components/store/StoreCard";
import type { Category, Store } from "@/types";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-muted-300 text-muted-700 hover:bg-surface-100"
      )}
    >
      {children}
    </button>
  );
}

export function VerifiedStoresSection({
  featuredStores,
  categories,
  storesByCategoryId,
  verifiedCouponCountByStore,
}: {
  featuredStores: Store[];
  categories: Category[];
  storesByCategoryId: Record<string, Store[]>;
  verifiedCouponCountByStore: Record<string, number>;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const visibleStores = activeCategoryId
    ? (storesByCategoryId[activeCategoryId] ?? [])
    : featuredStores;

  return (
    <div>
      <SectionHeader
        title="Browse top verified stores"
        subtitle={`${visibleStores.length} ${visibleStores.length === 1 ? "store" : "stores"} shown`}
        align="left"
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <div className="shrink-0">
          <TabButton active={activeCategoryId === null} onClick={() => setActiveCategoryId(null)}>
            Most Popular
          </TabButton>
        </div>
        {categories.map((category) => (
          <div key={category.id} className="shrink-0">
            <TabButton
              active={activeCategoryId === category.id}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </TabButton>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {visibleStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            couponCount={verifiedCouponCountByStore[store.id] ?? 0}
            countLabel="verified"
            pluralizeLabel={false}
          />
        ))}
      </div>
    </div>
  );
}
