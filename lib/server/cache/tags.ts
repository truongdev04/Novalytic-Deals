// Fixed set of purgeable list-level cache tags — used by the admin
// "purge cache" action so it can only ever bust a known, bounded set of
// tags rather than arbitrary per-item tags like `store:${slug}`.
export const KNOWN_CACHE_TAGS = [
  "stores:list",
  "coupons:list",
  "categories:list",
  "blog:list",
  "blog-topics:list",
  "events:list",
  "settings:general",
  "settings:integrations",
  "settings:affiliate",
  "redirects:list",
] as const;

export type KnownCacheTag = (typeof KNOWN_CACHE_TAGS)[number];
