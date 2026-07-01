import type { Metadata } from "next";
import { getEvents } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EventCard } from "@/components/event/EventCard";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Seasonal Events & Sales — NovalyticDeals",
  description:
    "Black Friday, Cyber Monday, Christmas, and every major sales event — curated coupons in one place.",
  path: "/events",
});

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Event Sales", path: "/events" }]} />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">Event sales</h1>
        <p className="mt-2 text-muted-600">
          Curated coupons and deals for every major shopping event of the year.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </Container>
  );
}
