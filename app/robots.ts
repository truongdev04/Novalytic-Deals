import type { MetadataRoute } from "next";
import { getGeneralSettings } from "@/lib/data";
import { SITE_URL as siteUrl } from "@/lib/constants/site";

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
