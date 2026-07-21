"use client";

import { useMemo, useState } from "react";
import { AlphabetNav } from "@/components/store/AlphabetNav";
import { StoreCard } from "@/components/store/StoreCard";
import type { Store } from "@/types";

const PAGE_SIZE = 50;

function letterKeyOf(name: string): string {
  return /^[a-z]/i.test(name[0]) ? name[0].toUpperCase() : "#";
}

export function CategoryStoresGrid({
  stores,
  verifiedCouponCountByStore,
}: {
  stores: Store[];
  verifiedCouponCountByStore: Record<string, number>;
}) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [prevLetter, setPrevLetter] = useState(selectedLetter);
  if (prevLetter !== selectedLetter) {
    setPrevLetter(selectedLetter);
    setVisibleCount(PAGE_SIZE);
  }

  const availableLetters = useMemo(
    () => new Set(stores.map((store) => letterKeyOf(store.name))),
    [stores]
  );

  const filteredStores = useMemo(
    () =>
      selectedLetter ? stores.filter((store) => letterKeyOf(store.name) === selectedLetter) : stores,
    [stores, selectedLetter]
  );

  const visibleStores = filteredStores.slice(0, visibleCount);
  const hasMore = visibleCount < filteredStores.length;

  return (
    <div>
      <AlphabetNav
        availableLetters={availableLetters}
        activeLetter={selectedLetter ?? undefined}
        onSelect={setSelectedLetter}
        className="mb-6"
      />

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

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-xl border border-muted-300 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface-100"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
