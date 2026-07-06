import { getAllStores, getCoupons } from "@/lib/data";
import { EventForm } from "@/components/admin/EventForm";

export default async function NewEventPage() {
  const [stores, coupons] = await Promise.all([getAllStores(), getCoupons()]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New event</h1>
      <div className="mt-6">
        <EventForm stores={stores} coupons={coupons} />
      </div>
    </div>
  );
}
