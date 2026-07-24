import { Link } from "next-view-transitions";
import { groupStoresByLetter } from "@/lib/data/stores";
import { StoreLogo } from "@/components/store/StoreLogo";
import { cn } from "@/lib/utils";
import type { Store } from "@/types";

export function StoreListAZ({ stores }: { stores: Store[] }) {
  const groups = groupStoresByLetter(stores);

  return (
    <div>
      <div id="store-index" className="space-y-10">
        {[...groups.entries()].map(([letter, letterStores]) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
            <h2 className="mb-4 font-heading text-lg font-semibold text-brand-950">{letter}</h2>
            <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
              {letterStores.map((store) => (
                <li key={store.id}>
                  <Link
                    href={`/store/${store.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-muted-200 bg-surface-0 p-3 hover:border-brand-300 hover:shadow-sm"
                  >
                    <StoreLogo logoUrl={store.logoUrl} name={store.name} size="sm" />
                    <div>
                      <p className="font-medium text-brand-950">{store.name}</p>
                      <p className="text-xs text-muted-500">View coupons</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
