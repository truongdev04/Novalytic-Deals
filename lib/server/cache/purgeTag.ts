import { revalidateTag } from "next/cache";

// Next.js 16's revalidateTag requires a cache-life profile as the second
// argument. { expire: 0 } means "treat as stale immediately."
export function purgeTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}
