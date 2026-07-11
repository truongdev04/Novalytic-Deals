import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllDeals, getAllStores, getEvents } from "@/lib/data";
import { DealTable } from "@/components/admin/DealTable";

export default async function AdminDealsPage() {
  const [deals, stores, events] = await Promise.all([
    getAllDeals(),
    getAllStores(),
    getEvents(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Deals</h1>
          <p className="mt-1 text-sm text-muted-500">{deals.length} deals.</p>
        </div>
        <Link
          href="/admin/deals/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Deal
        </Link>
      </div>
      <div className="mt-6">
        <DealTable deals={deals} stores={stores} events={events} />
      </div>
    </div>
  );
}
