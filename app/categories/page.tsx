import type { Metadata } from "next";
import { getCategories, getStores, getCoupons } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CategoryCard } from "@/components/category/CategoryCard";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "All Categories — Shop Coupons by Category",
  description: "Find deals organized by category to shop what you love.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const [categories, stores, coupons] = await Promise.all([
    getCategories(),
    getStores(),
    getCoupons(),
  ]);

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const couponCountByCategory = new Map<string, number>();
  for (const category of categories) {
    const count = coupons.filter((c) => {
      const store = storeById.get(c.storeId);
      return store?.categoryIds.includes(category.id);
    }).length;
    couponCountByCategory.set(category.id, count);
  }

  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Categories", path: "/categories" }]} />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">All categories</h1>
        <p className="mt-2 text-muted-600">
          Find deals organized by category to shop what you love.
        </p>
      </div>

      <div className="mt-10">
        <SectionHeader
          title="Browse by category"
          subtitle="Discover coupons for every shopping need"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              couponCount={couponCountByCategory.get(category.id) ?? 0}
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
