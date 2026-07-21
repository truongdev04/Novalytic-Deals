import {
  getStoresAdminPaginated,
  getCategories,
  getEvents,
  getPopularStoresSettings,
  type AdminStoreFilters,
} from "@/lib/data";
import { StoreTable } from "@/components/admin/StoreTable";
import { PopularStoresControls } from "@/components/admin/PopularStoresControls";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";

function parseBool(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseEventId(value?: string): string | null | undefined {
  if (!value) return undefined;
  if (value === "uncategorized") return null;
  return value;
}

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    event?: string;
    featured?: string;
    pin?: string;
    status?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const filters: AdminStoreFilters = {
    query: params.q || undefined,
    categoryId: params.category || undefined,
    eventId: parseEventId(params.event),
    isFeatured: parseBool(params.featured),
    isPin: parseBool(params.pin),
    isActive: params.status === "active" ? true : params.status === "hidden" ? false : undefined,
  };

  const [{ items: stores, total }, categories, events, popularStoresSettings] = await Promise.all([
    getStoresAdminPaginated(filters, page, pageSize),
    getCategories(),
    getEvents(),
    getPopularStoresSettings(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-950">Stores</h1>
          <p className="mt-1 text-sm text-muted-500">{total} stores.</p>
        </div>
        <PopularStoresControls
          initialAutoPopularEnabled={popularStoresSettings.autoPopularEnabled}
          initialLastRefreshedAt={popularStoresSettings.lastRefreshedAt}
        />
      </div>

      <div className="mt-6">
        <StoreTable
          stores={stores}
          categories={categories}
          events={events}
          total={total}
          page={page}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
