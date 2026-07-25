export function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com"
);
