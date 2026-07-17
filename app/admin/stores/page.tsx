import { getAllStores, getCategories, getEvents, getPopularStoresSettings } from "@/lib/data";
import { StoreTable } from "@/components/admin/StoreTable";
import { PopularStoresControls } from "@/components/admin/PopularStoresControls";

export default async function AdminStoresPage() {
  const [stores, categories, events, popularStoresSettings] = await Promise.all([
    getAllStores(),
    getCategories(),
    getEvents(),
    getPopularStoresSettings(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Stores</h1>
          <p className="mt-1 text-sm text-muted-500">{stores.length} stores.</p>
        </div>
        <PopularStoresControls
          initialAutoPopularEnabled={popularStoresSettings.autoPopularEnabled}
          initialLastRefreshedAt={popularStoresSettings.lastRefreshedAt}
        />
      </div>

      <div className="mt-6">
        <StoreTable stores={stores} categories={categories} events={events} />
      </div>
    </div>
  );
}
