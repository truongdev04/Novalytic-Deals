import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCategories,
  getStoresByCategory,
  getCoupons,
  filterCoupons,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreCard } from "@/components/store/StoreCard";
import { CouponCard } from "@/components/coupon/CouponCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { faqPageJsonLd } from "@/lib/seo/jsonld";
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
  return await buildMetadata({
    title: category.seo.title,
    description: category.seo.description,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [topStores, coupons] = await Promise.all([
    getStoresByCategory(category.id),
    filterCoupons({ categoryId: category.id, sort: "discount" }),
  ]);

  const allCoupons = await getCoupons();
  const couponCountByStore = new Map<string, number>();
  for (const coupon of allCoupons) {
    couponCountByStore.set(coupon.storeId, (couponCountByStore.get(coupon.storeId) ?? 0) + 1);
  }

  const storeById = new Map(topStores.map((s) => [s.id, s]));

  return (
    <Container className="py-10">
      {category.faq.length > 0 && <JsonLd data={faqPageJsonLd(category.faq)} />}

      <Breadcrumb
        items={[
          { name: "Categories", path: "/categories" },
          { name: category.name, path: `/categories/${category.slug}` },
        ]}
      />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">{category.name}</h1>
        <p className="mt-2 text-muted-600">{category.description}</p>
      </div>

      {topStores.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Top stores" align="left" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {topStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                couponCount={couponCountByStore.get(store.id) ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <SectionHeader title="Coupons & deals" align="left" />
        {coupons.length === 0 ? (
          <EmptyState
            title="No active coupons right now"
            description="Check back soon for new offers in this category."
          />
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return store ? <CouponCard key={coupon.id} coupon={coupon} store={store} /> : null;
            })}
          </div>
        )}
      </div>

      {category.faq.length > 0 && (
        <div className="mt-12">
          <SectionHeader title="Frequently asked questions" align="left" />
          <FAQAccordion items={category.faq} />
        </div>
      )}
    </Container>
  );
}
