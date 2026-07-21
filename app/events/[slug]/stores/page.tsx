import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getEventBySlug,
  getEvents,
  getStoresByIds,
  getVerifiedCouponCountByStoreIds,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EventStoresGrid } from "@/components/event/EventStoresGrid";
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
    title: `${event.name} Stores — Coupons & Deals`,
    description: `Browse every store participating in ${event.name}.`,
    path: `/events/${event.slug}/stores`,
  });
}

export default async function EventStoresPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const stores = await getStoresByIds(event.featuredStoreIds);
  const verifiedCouponCountByStore = await getVerifiedCouponCountByStoreIds(
    stores.map((s) => s.id)
  );

  return (
    <Container className="py-10">
      <Breadcrumb
        items={[
          { name: "Event Sales", path: "/events" },
          { name: event.name, path: `/events/${event.slug}` },
          { name: "All stores", path: `/events/${event.slug}/stores` },
        ]}
      />

      <div className="mt-6">
        <h1 className="font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
          {event.name} stores
        </h1>
        <p className="mt-1 text-sm text-muted-600">
          Showing {stores.length} {stores.length === 1 ? "store" : "stores"}.
        </p>
      </div>

      <div className="mt-8">
        <EventStoresGrid stores={stores} verifiedCouponCountByStore={verifiedCouponCountByStore} />
      </div>
    </Container>
  );
}
