import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStoreBySlug,
  getStores,
  getCouponsByStore,
  getRelatedStores,
  getRelatedStoresCount,
  getCategoryById,
  getApprovedReviewsByStore,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreCouponTabs } from "@/components/store/StoreCouponTabs";
import { StoreCard } from "@/components/store/StoreCard";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { RichHtml } from "@/components/ui/RichHtml";
import { ReviewList } from "@/components/store/ReviewList";
import { ReviewForm } from "@/components/store/ReviewForm";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { faqPageJsonLd, storeAggregateRatingJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDiscount, isExpired } from "@/lib/utils";
import { resolveStoreContent } from "@/lib/content/defaults";
import { getUtcMonthName } from "@/lib/content/template";

export const revalidate = 86400;

export async function generateStaticParams() {
  const stores = await getStores();
  return stores.map((store) => ({ slug: store.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rawStore = await getStoreBySlug(slug);
  if (!rawStore) return {};
  const store = await resolveStoreContent(rawStore);
  return await buildMetadata({
    title: store.seo.title,
    description: store.seo.description,
    path: `/store/${store.slug}`,
    image: store.bannerUrl,
  });
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawStore = await getStoreBySlug(slug);
  if (!rawStore) notFound();
  const store = await resolveStoreContent(rawStore);

  const [coupons, relatedStores, relatedStoresCount, reviews] = await Promise.all([
    getCouponsByStore(store.id),
    getRelatedStores(store, 10),
    getRelatedStoresCount(store),
    getApprovedReviewsByStore(store.id),
  ]);

  const activeCoupons = coupons.filter((c) => !isExpired(c.expiresAt));
  const bestOffer = activeCoupons.reduce<(typeof activeCoupons)[number] | null>(
    (best, c) => (!best || c.discountValue > best.discountValue ? c : best),
    null
  );

  const relatedCoupons = await Promise.all(relatedStores.map((s) => getCouponsByStore(s.id)));
  const relatedVerifiedCouponCounts = relatedCoupons.map(
    (storeCoupons) => storeCoupons.filter((c) => c.verified).length
  );

  // relatedStores is only ever non-empty when store.categoryIds has at
  // least one entry (see getRelatedStores' early return), so this is safe
  // to look up only inside the `relatedStores.length > 0` block below.
  const primaryCategory =
    relatedStores.length > 0 ? await getCategoryById(store.categoryIds[0]) : undefined;

  return (
    <Container className="py-10">
      <JsonLd data={storeAggregateRatingJsonLd(store)} />
      {store.faq.length > 0 && <JsonLd data={faqPageJsonLd(store.faq)} />}

      <Breadcrumb
        items={[
          { name: "Stores", path: "/stores" },
          { name: store.name, path: `/store/${store.slug}` },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <StoreHeader
            store={store}
            totalCoupons={coupons.length}
            activeDeals={activeCoupons.length}
            bestOfferLabel={
              bestOffer
                ? formatDiscount(bestOffer.type, bestOffer.discountType, bestOffer.discountValue, bestOffer.currency)
                : undefined
            }
          />
        </div>

        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-950 sm:text-4xl">
            {store.name} Promo Codes &amp; Coupons - {getUtcMonthName(new Date())}{" "}
            {new Date().getUTCFullYear()}
          </h1>
          <p className="mt-1 text-sm text-muted-600">
            {activeCoupons.length} active {activeCoupons.length === 1 ? "offer" : "offers"} available
          </p>

          <div className="mt-6">
            <StoreCouponTabs coupons={coupons} store={store} />
          </div>

          {store.aboutStore && (
            <div className="mt-12">
              <SectionHeader title={`About ${store.name}`} align="left" />
              <RichHtml html={store.aboutStore} className="text-sm text-muted-600" />
            </div>
          )}

          {store.howToApply && (
            <div className="mt-12">
              <SectionHeader title="How to apply" align="left" />
              <RichHtml html={store.howToApply} className="text-sm text-muted-600" />
            </div>
          )}

          {store.faq.length > 0 && (
            <div className="mt-12">
              <SectionHeader title="Frequently asked questions" align="left" />
              <FAQAccordion items={store.faq} />
            </div>
          )}

          <div className="mt-12">
            <SectionHeader title="Reviews" align="left" />
            <ReviewList reviews={reviews} />
            <div className="mt-8 border-t border-muted-200 pt-8">
              <h3 className="font-heading text-sm font-semibold text-brand-950">
                Leave a review
              </h3>
              <div className="mt-4">
                <ReviewForm storeSlug={store.slug} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedStores.length > 0 && (
        <div className="mt-16">
          <SectionHeader title="Related stores" align="left" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {relatedStores.map((related, i) => (
              <StoreCard
                key={related.id}
                store={related}
                couponCount={relatedVerifiedCouponCounts[i]}
                countLabel="verified"
                pluralizeLabel={false}
              />
            ))}
          </div>

          {primaryCategory && relatedStoresCount > relatedStores.length && (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/categories/${primaryCategory.slug}`}
                className="rounded-xl border border-muted-300 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface-100"
              >
                View all
              </Link>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
