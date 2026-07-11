import type { Metadata } from "next";
import {
  filterCoupons,
  getCategories,
  getCategoryBySlug,
  getContentConfigSettings,
  getCoupons,
  getStores,
  getStoreBySlug,
  searchStores,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchBox } from "@/components/search/SearchBox";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { SortDropdown } from "@/components/search/SortDropdown";
import { ActiveFiltersBar, type ActiveFilter } from "@/components/search/ActiveFiltersBar";
import { CouponCard } from "@/components/coupon/CouponCard";
import { StoreCard } from "@/components/store/StoreCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildQueryUrl } from "@/lib/utils";
import type { CouponFilters } from "@/lib/data/coupons";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Search Coupons, Deals & Stores",
    description: "Search thousands of verified coupon codes, deals, and stores.",
    path: "/search",
  });
}

const SORT_VALUES: CouponFilters["sort"][] = ["relevance", "expiring", "newest", "discount"];

function parseSort(value?: string): CouponFilters["sort"] {
  return SORT_VALUES.includes(value as CouponFilters["sort"])
    ? (value as CouponFilters["sort"])
    : "relevance";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    store?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";

  const [categories, stores, category, store, matchingStores, allCoupons, config] =
    await Promise.all([
      getCategories(),
      getStores(),
      params.category ? getCategoryBySlug(params.category) : undefined,
      params.store ? getStoreBySlug(params.store) : undefined,
      query ? searchStores(query) : Promise.resolve([]),
      getCoupons(),
      getContentConfigSettings(),
    ]);
  const couponCountByStore = new Map<string, number>();
  for (const coupon of allCoupons) {
    couponCountByStore.set(coupon.storeId, (couponCountByStore.get(coupon.storeId) ?? 0) + 1);
  }

  const allFiltered = await filterCoupons({
    query,
    categoryId: category?.id,
    storeSlug: params.store,
    sort: parseSort(params.sort),
  });

  const pageSize = config.pagination.searchPageSize;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / pageSize));
  const pageItems = allFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const activeFilters: ActiveFilter[] = [];
  if (category) activeFilters.push({ key: "category", label: category.name });
  if (store) activeFilters.push({ key: "store", label: store.name });

  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Search", path: "/search" }]} />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">
          {query ? `Results for "${query}"` : "Search"}
        </h1>
        <p className="mt-2 text-muted-600">
          {allFiltered.length} {allFiltered.length === 1 ? "result" : "results"} found
        </p>
      </div>

      <div className="mt-6 max-w-md">
        <SearchBox defaultValue={query} action="/search" />
      </div>

      {matchingStores.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-heading text-lg font-semibold text-brand-950">Stores</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {matchingStores.slice(0, 4).map((s) => (
              <StoreCard key={s.id} store={s} couponCount={couponCountByStore.get(s.id) ?? 0} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Coupons & deals</h2>
          <div className="flex flex-wrap gap-3">
            <FilterSidebar categories={categories} stores={stores} />
            <SortDropdown />
          </div>
        </div>
        <ActiveFiltersBar basePath="/search" params={params} filters={activeFilters} />
      </div>

      <div className="mt-6">
        {pageItems.length === 0 ? (
          <EmptyState
            title="No results found"
            description="Try a different search term or clear your filters."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((coupon) => {
              const s = storeById.get(coupon.storeId);
              return s ? <CouponCard key={coupon.id} coupon={coupon} store={s} /> : null;
            })}
          </div>
        )}
      </div>

      <div className="mt-10">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={(page) => buildQueryUrl("/search", params, { page: String(page) })}
        />
      </div>
    </Container>
  );
}
