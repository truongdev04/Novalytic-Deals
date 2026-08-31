import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Turnstile + GA + Plausible origins are allow-listed even if unused —
// those integrations are opt-in via env vars and won't load a script unless
// configured, so the extra CSP entries are inert until then.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com https://plausible.io https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  // https: (any host) is needed because admins can paste an external image
  // URL (Google, Facebook, etc.) directly into the rich-text image dialog,
  // not just upload to Supabase/Cloudinary.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://challenges.cloudflare.com",
  // AI provider hosts are for the internal "Tool Auto Fill" (public/tools/auto-fill/)
  // calling each provider's API directly from the browser with a user-supplied key.
  // analytics.google.com/stats.g.doubleclick.net/www.google.com are GA4's actual
  // collect/conversion endpoints (gtag.js posts there, not to google-analytics.com,
  // whenever the GA4 property has Google Ads linked).
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.google.com https://plausible.io https://vitals.vercel-insights.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://openrouter.ai",
  "object-src 'none'",
  "base-uri 'self'",
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Custom loader (lib/image/cloudinaryLoader.ts) — bypasses Vercel Image
    // Optimization entirely. Cloudinary URLs get a responsive `w_<width>,
    // f_auto,q_auto` transform injected (srcSet still built by next/image);
    // everything else (local SVG, pasted URLs) passes through untouched.
    // This removes the "pay twice" cost on Image Optimization + Fast Origin
    // Transfer for our Cloudinary-hosted logos/deal images.
    //
    // remotePatterns / minimumCacheTTL are intentionally gone: they only
    // configure the built-in optimizer, which no longer runs.
    loader: "custom",
    loaderFile: "./lib/image/cloudinaryLoader.ts",
  },
};

export default nextConfig;
