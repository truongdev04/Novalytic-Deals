import type { MetadataRoute } from "next";
import { getStores, getCoupons, getCategories, getBlogPosts, getEvents } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stores, coupons, categories, posts, events] = await Promise.all([
    getStores(),
    getCoupons(),
    getCategories(),
    getBlogPosts(),
    getEvents(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/stores",
    "/categories",
    "/deals",
    "/events",
    "/blog",
    "/search",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/submit",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const storeRoutes: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${siteUrl}/store/${store.slug}`,
    lastModified: store.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const couponRoutes: MetadataRoute.Sitemap = coupons.map((coupon) => ({
    url: `${siteUrl}/coupon/${coupon.slug}`,
    lastModified: coupon.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
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
    ...storeRoutes,
    ...couponRoutes,
    ...categoryRoutes,
    ...blogRoutes,
    ...eventRoutes,
  ];
}
