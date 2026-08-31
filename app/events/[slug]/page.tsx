import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EVENT_CURATED_COUPON_LIMIT,
  getEventBySlug,
  getEvents,
  getCouponsByIds,
  getStoresByIds,
  getVerifiedCouponCountByStoreIds,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { DividedSections } from "@/components/layout/DividedSections";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHero } from "@/components/layout/PageHero";
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

// "Permanent" — cached until the event, an underlying store, or coupon
// purges its tag (event:<slug>/stores:list/coupons:list), or the daily
// Vercel Cron sweep runs. Not on a time-based schedule.
export const revalidate = false;


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
    title: `${event.name} Deals & Coupons`,
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

  // "Curated deals" reads the event's stored, pre-randomized curatedCouponIds
  // — not featuredCouponIds — so the public list only changes when an admin
  // re-rolls it or a store leaves the event, never on re-render or when a
  // store is added.
  const [coupons, stores, faq] = await Promise.all([
    // `?? []` guards a stale event:<slug> cache entry serialized before this
    // field existed (pre-deploy) — it self-heals on the next event/store edit.
    getCouponsByIds(event.curatedCouponIds ?? []),
    getStoresByIds(event.featuredStoreIds),
    resolveEventFaq(event.name),
  ]);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const verifiedCouponCountByStore = await getVerifiedCouponCountByStoreIds(
    stores.map((s) => s.id)
  );
  const visibleCoupons = coupons.slice(0, EVENT_CURATED_COUPON_LIMIT);
  const breadcrumbItems = [
    { name: "Event Sales", path: "/events" },
    { name: event.name, path: `/events/${event.slug}` },
  ];

  return (
    <div>
      {faq.length > 0 && <JsonLd data={faqPageJsonLd(faq)} />}
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <PageHero imageSrc={event.bannerUrl ?? undefined} contentClassName="gap-4">
        <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/15 text-white">
          {renderCategoryIcon(event, { iconClassName: "h-6 w-6" })}
        </span>
        <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">{event.name}</h1>
        <p className="max-w-xl text-brand-100">{event.description}</p>
      </PageHero>

      <Container className="pt-10">
        <Breadcrumb items={breadcrumbItems} />
      </Container>

      <DividedSections className="mt-10 pb-16">
        {stores.length > 0 && (
          <section>
            <Container>
            <SectionHeader title="Featured stores" align="left" />
            <StoreGrid
              stores={stores}
              verifiedCouponCountByStore={verifiedCouponCountByStore}
              viewAllHref={`/events/${event.slug}/stores`}
            />
            </Container>
          </section>
        )}

        <section>
          <Container>
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
          </Container>
        </section>

        {faq.length > 0 && (
          <section>
            <Container>
            <SectionHeader title="Frequently asked questions" align="left" />
            <FAQAccordion items={faq} />
            </Container>
          </section>
        )}
      </DividedSections>
    </div>
  );
}
