import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CouponType, DiscountType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Strips HTML tags from rich-text fields (e.g. Store.description) for
// contexts that only show a short plain-text excerpt, like a card blurb.
export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDiscount(
  couponType: CouponType,
  discountType: DiscountType,
  discountValue: number,
  currency: string
) {
  if (discountType === "PERCENT") return `${discountValue}% OFF`;
  if (discountType === "AMOUNT") return `${currency}${discountValue} OFF`;
  if (couponType === "FREESHIP") return "FREE SHIPPING";
  return "DEAL";
}

export function formatExpiration(expiresAt?: string) {
  if (!expiresAt) return "No expiration";
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days === 1) return "Ends today";
  if (days <= 30) return `Ends in ${days}d`;
  return `Ends ${new Date(expiresAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function isExpiringSoon(expiresAt?: string, thresholdDays = 3) {
  if (!expiresAt) return false;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return false;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) <= thresholdDays;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Deterministic string hash (cyrb53-style) — turns an arbitrary seed string
// into a 32-bit int for seededShuffle's PRNG below.
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return h;
}

// Seeded Fisher-Yates shuffle (mulberry32 PRNG) — same seed always produces
// the same order, so callers can get a "random" selection that's stable
// across requests within a given cache window (e.g. one calendar month)
// without persisting the chosen order anywhere.
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let state = hashSeed(seed) || 1;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildQueryUrl(
  pathname: string,
  currentParams: URLSearchParams | Record<string, string | undefined>,
  updates: Record<string, string | undefined>
) {
  const params = new URLSearchParams(
    currentParams instanceof URLSearchParams
      ? currentParams
      : Object.entries(currentParams).filter(([, v]) => v !== undefined) as [string, string][]
  );

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  // Changing a filter/sort should reset back to page 1 — but only when the
  // caller isn't explicitly setting `page` itself (e.g. pagination links),
  // otherwise every page link would collapse back to page 1.
  if (!("page" in updates)) {
    params.delete("page");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const PENDING_CODE_REVEAL_KEY = "novalytic:pendingCodeReveal";

// "Show Code" opens the store in the current tab and a duplicate of the
// current page in a new tab where the code dialog should auto-open. Since
// that new tab is a fresh page load (no React state to hand off), the
// pending coupon/deal id is passed through localStorage — shared across
// same-origin tabs regardless of window.open's noopener setting, unlike
// sessionStorage which only clones to auxiliary (non-noopener) tabs.
export function setPendingCodeReveal(id: string) {
  try {
    localStorage.setItem(PENDING_CODE_REVEAL_KEY, JSON.stringify({ id, ts: Date.now() }));
  } catch {
    // localStorage unavailable (private mode, etc.) — safe to no-op
  }
}

export function consumePendingCodeReveal(id: string): boolean {
  try {
    const raw = localStorage.getItem(PENDING_CODE_REVEAL_KEY);
    if (!raw) return false;
    const { id: pendingId, ts } = JSON.parse(raw) as { id: string; ts: number };
    if (pendingId !== id || Date.now() - ts > 10_000) return false;
    localStorage.removeItem(PENDING_CODE_REVEAL_KEY);
    return true;
  } catch {
    return false;
  }
}
