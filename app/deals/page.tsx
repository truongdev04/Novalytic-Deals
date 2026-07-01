import type { Metadata } from "next";
import {
  filterCoupons,
  getCategories,
  getCategoryBySlug,
  getStores,
  getStoreBySlug,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchBox } from "@/components/search/SearchBox";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { SortDropdown } from "@/components/search/SortDropdown";
import { ActiveFiltersBar, type ActiveFilter } from "@/components/search/ActiveFiltersBar";
import { CouponCard } from "@/components/coupon/CouponCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildQueryUrl } from "@/lib/utils";
import type { CouponFilters } from "@/lib/data/coupons";

export const revalidate = 300;

const SORT_VALUES: CouponFilters["sort"][] = ["relevance", "expiring", "newest", "discount"];

function parseSort(value?: string): CouponFilters["sort"] {
  return SORT_VALUES.includes(value as CouponFilters["sort"])
    ? (value as CouponFilters["sort"])
    : "relevance";
}

export const metadata: Metadata = buildMetadata({
  title: "All Deals — Browse the Latest Coupon Codes & Offers",
  description: "Browse all deals and save money today. Filter by category, store, and discount.",
  path: "/deals",
});

const PAGE_SIZE = 9;

export default async function DealsPage({
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
  const [categories, stores, category, store] = await Promise.all([
    getCategories(),
    getStores(),
    params.category ? getCategoryBySlug(params.category) : undefined,
    params.store ? getStoreBySlug(params.store) : undefined,
  ]);

  const allFiltered = await filterCoupons({
    query: params.q,
    categoryId: category?.id,
    storeSlug: params.store,
    sort: parseSort(params.sort),
  });

  const currentPage = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const pageItems = allFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const storeById = new Map(stores.map((s) => [s.id, s]));

  const activeFilters: ActiveFilter[] = [];
  if (params.q) activeFilters.push({ key: "q", label: `"${params.q}"` });
  if (category) activeFilters.push({ key: "category", label: category.name });
  if (store) activeFilters.push({ key: "store", label: store.name });

  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Deals", path: "/deals" }]} />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">All deals</h1>
        <p className="mt-2 text-muted-600">
          Discover the latest coupon codes and exclusive offers.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox defaultValue={params.q} placeholder="Search deals..." action="/deals" className="sm:max-w-xs" />
          <div className="flex flex-wrap gap-3">
            <FilterSidebar categories={categories} stores={stores} />
            <SortDropdown />
          </div>
        </div>
        <ActiveFiltersBar
          basePath="/deals"
          params={params}
          filters={activeFilters}
        />
      </div>

      <div className="mt-8">
        {pageItems.length === 0 ? (
          <EmptyState
            title="No deals found matching your filters"
            description="Try adjusting your search or clearing filters to see more results."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return store ? <CouponCard key={coupon.id} coupon={coupon} store={store} /> : null;
            })}
          </div>
        )}
      </div>

      <div className="mt-10">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={(page) => buildQueryUrl("/deals", params, { page: String(page) })}
        />
      </div>
    </Container>
  );
}
