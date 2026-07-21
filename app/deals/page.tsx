import type { Metadata } from "next";
import Link from "next/link";
import {
  filterDealsPaginated,
  getCategories,
  getCategoryBySlug,
  getStores,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { DealsHero } from "@/components/deal/DealsHero";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { SortDropdown } from "@/components/search/SortDropdown";
import { ActiveFiltersBar, type ActiveFilter } from "@/components/search/ActiveFiltersBar";
import { DealProductCard } from "@/components/deal/DealProductCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildQueryUrl } from "@/lib/utils";
import type { DealFilters } from "@/lib/data/deals";

export const revalidate = 300;

// Deal grid tops out at 5 columns (lg breakpoint) — a "batch" is 10 rows of
// that widest layout, i.e. how many deals load per initial page view / each
// "Show more" click.
const DEALS_BATCH_SIZE = 50;

const SORT_VALUES: DealFilters["sort"][] = ["relevance", "newest", "trending", "discount"];

function parseSort(value?: string): DealFilters["sort"] {
  return SORT_VALUES.includes(value as DealFilters["sort"])
    ? (value as DealFilters["sort"])
    : "relevance";
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "All Deals — Browse the Latest Coupon Codes & Offers",
    description: "Browse all deals and save money today. Search by store, filter by category.",
    path: "/deals",
  });
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const [categories, stores, category] = await Promise.all([
    getCategories(),
    getStores(),
    params.category ? getCategoryBySlug(params.category) : undefined,
  ]);

  const currentBatch = Math.max(1, Number(params.page) || 1);
  const itemsToShow = currentBatch * DEALS_BATCH_SIZE;

  const { items: pageItems, total } = await filterDealsPaginated(
    {
      query: params.q,
      categoryId: category?.id,
      sort: parseSort(params.sort),
    },
    1,
    itemsToShow
  );

  const hasMore = itemsToShow < total;

  const storeById = new Map(stores.map((s) => [s.id, s]));

  const activeFilters: ActiveFilter[] = [];
  if (params.q) activeFilters.push({ key: "q", label: `"${params.q}"` });
  if (category) activeFilters.push({ key: "category", label: category.name });

  return (
    <>
      <DealsHero defaultQuery={params.q} />

      <Container className="py-10">
        <Breadcrumb items={[{ name: "Deals", path: "/deals" }]} />

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap justify-end gap-3">
            <FilterSidebar categories={categories} />
            <SortDropdown />
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {pageItems.map((deal) => {
                const store = storeById.get(deal.storeId);
                return store ? <DealProductCard key={deal.id} deal={deal} store={store} /> : null;
              })}
            </div>
          )}
        </div>

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href={buildQueryUrl("/deals", params, { page: String(currentBatch + 1) })}>
                Show more
              </Link>
            </Button>
          </div>
        )}
      </Container>
    </>
  );
}
