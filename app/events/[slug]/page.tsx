import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getEventBySlug,
  getEvents,
  getCouponsByIds,
  getStoresByIds,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CountdownTimer } from "@/components/event/CountdownTimer";
import { CouponCard } from "@/components/coupon/CouponCard";
import { StoreCard } from "@/components/store/StoreCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { renderCategoryIcon } from "@/lib/icons";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

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
  return buildMetadata({
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

  const [coupons, stores] = await Promise.all([
    getCouponsByIds(event.featuredCouponIds),
    getStoresByIds(event.featuredStoreIds),
  ]);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const couponCountByStore = new Map<string, number>();
  for (const coupon of coupons) {
    couponCountByStore.set(coupon.storeId, (couponCountByStore.get(coupon.storeId) ?? 0) + 1);
  }
  return (
    <div>
      <section className="relative overflow-hidden">
        {event.bannerUrl && (
          <div className="absolute inset-0 -z-10">
            <Image src={event.bannerUrl} alt="" fill priority className="object-cover" />
          </div>
        )}
        <Container className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/15 text-white">
            {renderCategoryIcon(event, { iconClassName: "h-6 w-6" })}
          </span>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">{event.name}</h1>
          <p className="max-w-xl text-brand-100">{event.description}</p>
          {event.endsAt && <CountdownTimer endsAt={event.endsAt} />}
        </Container>
      </section>

      <Container className="py-10">
        <Breadcrumb
          items={[
            { name: "Event Sales", path: "/events" },
            { name: event.name, path: `/events/${event.slug}` },
          ]}
        />

        {stores.length > 0 && (
          <div className="mt-10">
            <SectionHeader title="Featured stores" align="left" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stores.map((store) => (
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
          <SectionHeader title="Curated deals" align="left" />
          {coupons.length === 0 ? (
            <EmptyState
              title="No deals yet"
              description="Check back soon — we're curating the best offers for this event."
            />
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => {
                const store = storeById.get(coupon.storeId);
                return store ? (
                  <CouponCard key={coupon.id} coupon={coupon} store={store} />
                ) : null;
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
