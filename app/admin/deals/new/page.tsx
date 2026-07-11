import { getAllStores, getCategories, getEvents } from "@/lib/data";
import { DealForm } from "@/components/admin/DealForm";

export default async function NewDealPage() {
  const [stores, events, categories] = await Promise.all([
    getAllStores(),
    getEvents(),
    getCategories(),
  ]);
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New deal</h1>
      <div className="mt-6">
        <DealForm stores={stores} events={events} categories={categories} />
      </div>
    </div>
  );
}
