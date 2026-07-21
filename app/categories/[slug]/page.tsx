import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCategories,
  getStoresByCategory,
  getVerifiedCouponCountByStoreIds,
  getBestCategoryCoupons,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreGrid } from "@/components/store/StoreGrid";
import { CouponGridCard } from "@/components/coupon/CouponGridCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { faqPageJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { renderCategoryIcon } from "@/lib/icons";
import { getUtcPeriodKey } from "@/lib/content/template";

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

  const [topStores, bestCoupons] = await Promise.all([
    getStoresByCategory(category.id),
    getBestCategoryCoupons(category.id, getUtcPeriodKey(new Date()), 20),
  ]);

  const verifiedCouponCountByStore = await getVerifiedCouponCountByStoreIds(
    topStores.map((s) => s.id)
  );

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

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 to-brand-800 px-6 py-12 text-center sm:py-16">
        <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white">
          {renderCategoryIcon(category, { iconClassName: "h-8 w-8" })}
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl">
          {category.name}
        </h1>
        <p className="mt-2 text-brand-100">{category.description}</p>
      </div>

      {topStores.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Top stores" align="left" />
          <StoreGrid
            stores={topStores}
            verifiedCouponCountByStore={verifiedCouponCountByStore}
            viewAllHref={`/categories/${category.slug}/stores`}
          />
        </div>
      )}

      <div className="mt-10">
        <SectionHeader title={`Best ${category.name} Coupon`} align="left" />
        {bestCoupons.length === 0 ? (
          <EmptyState
            title="No active coupons right now"
            description="Check back soon for new offers in this category."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {bestCoupons.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return store ? (
                <CouponGridCard key={coupon.id} coupon={coupon} store={store} />
              ) : null;
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
