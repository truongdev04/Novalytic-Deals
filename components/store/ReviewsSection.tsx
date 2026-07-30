"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Star } from "lucide-react";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Rating } from "@/components/ui/Rating";
import { Modal } from "@/components/ui/Modal";
import { ReviewForm } from "@/components/store/ReviewForm";
import { ReviewList } from "@/components/store/ReviewList";
import type { Review, Store } from "@/types";

export function ReviewsSection({ store, reviews }: { store: Store; reviews: Review[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      <SectionHeader
        title={`${store.name} customer reviews`}
        subtitle={`Hear what real users say about the ${store.name} shopping experience.`}
        align="left"
      />

      {store.ratingCount > 0 && (
        <Rating value={store.rating} count={store.ratingCount} size={20} className="mb-6" />
      )}

      <button
        type="button"
        onClick={() => setFormOpen(true)}
        className="mb-6 flex w-full flex-col items-start gap-1 rounded-xl border border-muted-200 bg-surface-100 p-5 text-left transition-colors hover:bg-muted-100"
      >
        <Megaphone className="h-6 w-6 text-brand-700" />
        <span className="mt-2 font-heading text-base font-semibold text-brand-950">
          Share your experience with {store.name}
        </span>
        <span className="text-sm text-muted-600">
          Help other shoppers by sharing your review of {store.name}.
        </span>
        <div className="mt-1.5 flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} width={16} height={16} className="text-muted-300" />
          ))}
        </div>
      </button>

      <ReviewList reviews={reviews} />

      <Modal open={formOpen} onOpenChange={setFormOpen} className="max-w-lg">
        <ReviewForm
          storeSlug={store.slug}
          storeName={store.name}
          onSubmitted={() => {
            setFormOpen(false);
            router.refresh();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
