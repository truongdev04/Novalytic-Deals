import { getAllDeals, getAllStores, getDealRefreshSettings, getEvents } from "@/lib/data";
import { DealTable } from "@/components/admin/DealTable";
import { DealControls } from "@/components/admin/DealControls";

export default async function AdminDealsPage() {
  const [deals, stores, events, dealRefreshSettings] = await Promise.all([
    getAllDeals(),
    getAllStores(),
    getEvents(),
    getDealRefreshSettings(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Deals</h1>
          <p className="mt-1 text-sm text-muted-500">{deals.length} deals.</p>
        </div>
        <DealControls
          initialAutoDealEnabled={dealRefreshSettings.autoDealEnabled}
          initialLastRefreshedAt={dealRefreshSettings.lastRefreshedAt}
        />
      </div>
      <div className="mt-6">
        <DealTable deals={deals} stores={stores} events={events} />
      </div>
    </div>
  );
}
