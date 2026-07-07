import type { MetadataRoute } from "next";
import { getGeneralSettings } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getGeneralSettings();

  if (!settings.robotsIndexingEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/go"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
