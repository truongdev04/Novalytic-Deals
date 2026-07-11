import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllStores, getCategories, getEvents } from "@/lib/data";
import { StoreTable } from "@/components/admin/StoreTable";

export default async function AdminStoresPage() {
  const [stores, categories, events] = await Promise.all([
    getAllStores(),
    getCategories(),
    getEvents(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Stores</h1>
          <p className="mt-1 text-sm text-muted-500">{stores.length} stores.</p>
        </div>
        <Link
          href="/admin/stores/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Store
        </Link>
      </div>

      <div className="mt-6">
        <StoreTable stores={stores} categories={categories} events={events} />
      </div>
    </div>
  );
}
