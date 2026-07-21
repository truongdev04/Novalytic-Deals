import type { Metadata } from "next";
import { getCategories } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CategoryCard } from "@/components/category/CategoryCard";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "All Categories — Shop Coupons by Category",
    description: "Find deals organized by category to shop what you love.",
    path: "/categories",
  });
}

export default async function CategoriesPage() {
  const categories = await getCategories();

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
            <CategoryCard key={category.id} category={category} showCount={false} />
          ))}
        </div>
      </div>
    </Container>
  );
}
