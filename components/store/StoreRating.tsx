import { Rating } from "@/components/ui/Rating";
import type { Store } from "@/types";

export function StoreRating({ store, size }: { store: Store; size?: number }) {
  return <Rating value={store.rating} count={store.ratingCount} size={size} />;
}
