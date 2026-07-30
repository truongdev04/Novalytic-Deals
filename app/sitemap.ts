import type { MetadataRoute } from "next";
import {
  getStores,
  getCategories,
  getBlogPosts,
  getEvents,
  getGeneralSettings,
  getFooterPages,
} from "@/lib/data";
import { SITE_URL as siteUrl } from "@/lib/constants/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getGeneralSettings();
  if (!settings.sitemapEnabled) return [];

  const [stores, categories, posts, events, pages] = await Promise.all([
    getStores(),
    getCategories(),
    getBlogPosts(),
    getEvents(),
    getFooterPages(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/stores",
    "/categories",
    "/deals",
    "/events",
    "/blog",
    "/contact",
    "/submit",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${siteUrl}/${page.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const storeRoutes: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${siteUrl}/store/${store.slug}`,
    lastModified: store.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/categories/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...storeRoutes,
    ...categoryRoutes,
    ...blogRoutes,
    ...eventRoutes,
  ];
}
