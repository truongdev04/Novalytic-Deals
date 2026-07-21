import {
  getDealsAdminPaginated,
  getAllStores,
  getDealRefreshSettings,
  getEvents,
  type AdminDealFilters,
} from "@/lib/data";
import { DealTable } from "@/components/admin/DealTable";
import { DealControls } from "@/components/admin/DealControls";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";
import type { Deal } from "@/types";

function parseBool(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const DEAL_TYPES: Deal["type"][] = ["DEAL", "CODE"];

function parseType(value?: string): Deal["type"] | undefined {
  return DEAL_TYPES.includes(value as Deal["type"]) ? (value as Deal["type"]) : undefined;
}

function parseEventId(value?: string): string | null | undefined {
  if (!value) return undefined;
  if (value === "uncategorized") return null;
  return value;
}

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    store?: string;
    type?: string;
    event?: string;
    featured?: string;
    status?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const filters: AdminDealFilters = {
    storeId: params.store || undefined,
    type: parseType(params.type),
    eventId: parseEventId(params.event),
    query: params.q || undefined,
    isFeatured: parseBool(params.featured),
    isActive: params.status === "active" ? true : params.status === "hidden" ? false : undefined,
  };

  const [{ items: deals, total }, stores, events, dealRefreshSettings] = await Promise.all([
    getDealsAdminPaginated(filters, page, pageSize),
    getAllStores(),
    getEvents(),
    getDealRefreshSettings(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Deals</h1>
          <p className="mt-1 text-sm text-muted-500">{total} deals.</p>
        </div>
        <DealControls
          initialAutoDealEnabled={dealRefreshSettings.autoDealEnabled}
          initialLastRefreshedAt={dealRefreshSettings.lastRefreshedAt}
        />
      </div>
      <div className="mt-6">
        <DealTable deals={deals} stores={stores} events={events} total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
