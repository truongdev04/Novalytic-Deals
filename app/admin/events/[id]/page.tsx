import { notFound } from "next/navigation";
import { getAllCoupons, getAllStores, getEventById } from "@/lib/data";
import { EventForm } from "@/components/admin/EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, stores, coupons] = await Promise.all([
    getEventById(id),
    getAllStores(),
    getAllCoupons(),
  ]);
  if (!event) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit event</h1>
      <div className="mt-6">
        <EventForm event={event} stores={stores} coupons={coupons} />
      </div>
    </div>
  );
}
