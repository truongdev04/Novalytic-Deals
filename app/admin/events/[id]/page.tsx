import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAllStores, getCoupons, getEventById, getEventOwnerId } from "@/lib/data";
import { EventForm } from "@/components/admin/EventForm";
import { isDataScoped } from "@/lib/permissions";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const scoped = isDataScoped(session?.user?.role, session?.user?.fullDataAccess, "events");
  const [event, ownerId, stores, coupons] = await Promise.all([
    getEventById(id),
    scoped ? getEventOwnerId(id) : Promise.resolve(undefined),
    getAllStores(),
    getCoupons(),
  ]);
  if (!event) notFound();
  if (scoped && ownerId !== session?.user?.id) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit event</h1>
      <div className="mt-6">
        <EventForm event={event} stores={stores} coupons={coupons} />
      </div>
    </div>
  );
}
