import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getStoreBySlug,
  getStores,
  getCouponsByStore,
  getRelatedStores,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreCouponTabs } from "@/components/store/StoreCouponTabs";
import { StoreCard } from "@/components/store/StoreCard";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { RichHtml } from "@/components/ui/RichHtml";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { faqPageJsonLd, storeAggregateRatingJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDiscount, isExpired } from "@/lib/utils";
import { resolveStoreContent } from "@/lib/content/defaults";

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

  const [coupons, relatedStores] = await Promise.all([
    getCouponsByStore(store.id),
    getRelatedStores(store, 4),
  ]);

  const activeCoupons = coupons.filter((c) => !isExpired(c.expiresAt));
  const bestOffer = activeCoupons.reduce<(typeof activeCoupons)[number] | null>(
    (best, c) => (!best || c.discountValue > best.discountValue ? c : best),
    null
  );

  const relatedCouponCounts = await Promise.all(
    relatedStores.map((s) => getCouponsByStore(s.id))
  );

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
          <h1 className="font-heading text-2xl font-semibold text-brand-950">
            {store.name} coupons & deals
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
        </div>
      </div>

      {relatedStores.length > 0 && (
        <div className="mt-16">
          <SectionHeader title="Related stores" align="left" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedStores.map((related, i) => (
              <StoreCard
                key={related.id}
                store={related}
                couponCount={relatedCouponCounts[i].length}
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
