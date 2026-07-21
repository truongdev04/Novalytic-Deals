import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCategories,
  getStoresByCategory,
  getVerifiedCouponCountByStoreIds,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CategoryStoresGrid } from "@/components/store/CategoryStoresGrid";
import { renderCategoryIcon } from "@/lib/icons";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildMetadata({
    title: `${category.name} Stores — Coupons & Deals`,
    description: `Browse every verified store in the ${category.name} category.`,
    path: `/categories/${category.slug}/stores`,
  });
}

export default async function CategoryStoresPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const stores = await getStoresByCategory(category.id);
  const verifiedCouponCountByStore = await getVerifiedCouponCountByStoreIds(
    stores.map((s) => s.id)
  );

  return (
    <Container className="py-10">
      <Breadcrumb
        items={[
          { name: "Stores", path: "/stores" },
          { name: category.name, path: `/categories/${category.slug}` },
          { name: "All stores", path: `/categories/${category.slug}/stores` },
        ]}
      />

      <div className="mt-6 flex items-center gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {renderCategoryIcon(category, { iconClassName: "h-7 w-7" })}
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
            {category.name} stores
          </h1>
          <p className="mt-1 text-sm text-muted-600">
            Showing {stores.length} {stores.length === 1 ? "verified store" : "verified stores"}.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CategoryStoresGrid
          stores={stores}
          verifiedCouponCountByStore={verifiedCouponCountByStore}
        />
      </div>
    </Container>
  );
}
