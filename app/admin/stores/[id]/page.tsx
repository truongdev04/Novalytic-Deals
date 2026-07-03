import { notFound } from "next/navigation";
import { getCategories, getEvents, getStoreById } from "@/lib/data";
import { StoreForm } from "@/components/admin/StoreForm";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [store, categories, events] = await Promise.all([
    getStoreById(id),
    getCategories(),
    getEvents(),
  ]);
  if (!store) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit store</h1>
      <div className="mt-6">
        <StoreForm store={store} categories={categories} events={events} />
      </div>
    </div>
  );
}
