"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { PopularStoreCard } from "@/components/store/PopularStoreCard";
import { cn } from "@/lib/utils";
import type { Store } from "@/types";

export function StoreCarousel({ stores }: { stores: Store[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: "auto" },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    // Defer the initial read to a microtask — Embla is already fully
    // initialized by the time this ref-driven `emblaApi` is non-null, so
    // there's no separate "ready" event left to hang the first sync off of.
    queueMicrotask(update);
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex">
          {stores.map((store) => (
            <div
              key={store.id}
              className="min-w-0 shrink-0 basis-1/2 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <PopularStoreCard store={store} />
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                index === selectedIndex ? "bg-brand-600" : "bg-muted-300 hover:bg-muted-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
