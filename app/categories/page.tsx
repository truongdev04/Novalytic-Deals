import type { Metadata } from "next";
import { getCategories, getContentConfigSettings } from "@/lib/data";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryBrowser } from "@/components/category/CategoryBrowser";
import { buildMetadata } from "@/lib/seo/metadata";

// "Permanent" — cached until a category CRUD/toggle purges "categories:list"
// (or the daily Vercel Cron sweep), not on a time-based schedule.
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "All Categories — Shop Coupons by Category",
    description: "Find deals organized by category to shop what you love.",
    path: "/categories",
  });
}

export default async function CategoriesPage() {
  const [categories, { pageBanners }] = await Promise.all([
    getCategories(),
    getContentConfigSettings(),
  ]);

  return (
    <CategoryBrowser
      categories={categories}
      banner={pageBanners.categories}
      breadcrumb={<Breadcrumb items={[{ name: "Categories", path: "/categories" }]} />}
    />
  );
}
