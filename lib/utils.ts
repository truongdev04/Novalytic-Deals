import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  discountType: "PERCENT" | "AMOUNT" | "OTHER",
  discountValue: number,
  currency: string
) {
  if (discountType === "PERCENT") return `${discountValue}% OFF`;
  if (discountType === "AMOUNT") return `${currency}${discountValue} OFF`;
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
  params.delete("page");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
