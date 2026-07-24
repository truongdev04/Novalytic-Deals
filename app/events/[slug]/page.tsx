import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getEventBySlug,
  getEvents,
  getCouponsByIds,
  getStoresByIds,
  getVerifiedCouponCountByStoreIds,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StoreGrid } from "@/components/store/StoreGrid";
import { CouponGridCard } from "@/components/coupon/CouponGridCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { renderCategoryIcon } from "@/lib/icons";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { resolveEventFaq } from "@/lib/content/defaults";

export const revalidate = 300;

// Curated deals grid tops out at 5 columns (lg breakpoint) — cap to 4 rows.
const CURATED_DEALS_LIMIT = 20;

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return await buildMetadata({
    title: `${event.name} Deals & Coupons — NovalyticDeals`,
    description: event.description,
    path: `/events/${event.slug}`,
    image: event.bannerUrl,
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [coupons, stores, faq] = await Promise.all([
    getCouponsByIds(event.featuredCouponIds),
    getStoresByIds(event.featuredStoreIds),
    resolveEventFaq(event.name),
  ]);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const verifiedCouponCountByStore = await getVerifiedCouponCountByStoreIds(
    stores.map((s) => s.id)
  );
  const visibleCoupons = coupons.slice(0, CURATED_DEALS_LIMIT);
  const breadcrumbItems = [
    { name: "Event Sales", path: "/events" },
    { name: event.name, path: `/events/${event.slug}` },
  ];

  return (
    <div>
      {faq.length > 0 && <JsonLd data={faqPageJsonLd(faq)} />}
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <section className="relative overflow-hidden">
        {event.bannerUrl && (
          <div className="absolute inset-0 -z-10">
            <Image src={event.bannerUrl} alt="" fill priority className="object-cover" />
          </div>
        )}
        <Container className="flex flex-col items-center gap-4 py-14 text-center sm:py-25">
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/15 text-white">
            {renderCategoryIcon(event, { iconClassName: "h-6 w-6" })}
          </span>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">{event.name}</h1>
          <p className="max-w-xl text-brand-100">{event.description}</p>
        </Container>
      </section>

      <Container className="py-10">
        <Breadcrumb items={breadcrumbItems} />

        {stores.length > 0 && (
          <div className="mt-10">
            <SectionHeader title="Featured stores" align="left" />
            <StoreGrid
              stores={stores}
              verifiedCouponCountByStore={verifiedCouponCountByStore}
              viewAllHref={`/events/${event.slug}/stores`}
            />
          </div>
        )}

        <div className="mt-10">
          <SectionHeader title="Curated deals" align="left" />
          {coupons.length === 0 ? (
            <EmptyState
              title="No deals yet"
              description="Check back soon — we're curating the best offers for this event."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {visibleCoupons.map((coupon) => {
                const store = storeById.get(coupon.storeId);
                return store ? (
                  <CouponGridCard key={coupon.id} coupon={coupon} store={store} />
                ) : null;
              })}
            </div>
          )}
        </div>

        {faq.length > 0 && (
          <div className="mt-12">
            <SectionHeader title="Frequently asked questions" align="left" />
            <FAQAccordion items={faq} />
          </div>
        )}
      </Container>
    </div>
  );
}
