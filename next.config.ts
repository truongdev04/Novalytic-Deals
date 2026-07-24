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
  "connect-src 'self' https://www.google-analytics.com https://plausible.io https://vitals.vercel-insights.com",
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
