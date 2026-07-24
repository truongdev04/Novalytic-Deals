import Image from "next/image";
import { Link } from "next-view-transitions";
import type { Store } from "@/types";

export function PopularStoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className="group flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-muted-200 bg-surface-0 p-8 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
    >
      <span className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-muted-200 bg-surface-0 transition-all duration-200 ease-out group-hover:scale-105 group-hover:border-brand-400 sm:h-32 sm:w-32">
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt={`${store.name} logo`}
            width={128}
            height={128}
            sizes="128px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-50 font-heading text-3xl font-semibold text-brand-600">
            {store.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <h3 className="font-heading text-base font-semibold text-brand-950 group-hover:text-brand-700 sm:text-lg">
        {store.name}
      </h3>
    </Link>
  );
}
