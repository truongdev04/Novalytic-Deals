import { notFound } from "next/navigation";
import { getAllStores, getCategories, getDealById, getEvents } from "@/lib/data";
import { DealForm } from "@/components/admin/DealForm";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deal, stores, events, categories] = await Promise.all([
    getDealById(id),
    getAllStores(),
    getEvents(),
    getCategories(),
  ]);
  if (!deal) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit deal</h1>
      <div className="mt-6">
        <DealForm deal={deal} stores={stores} events={events} categories={categories} />
      </div>
    </div>
  );
}
