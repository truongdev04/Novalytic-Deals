import type { Metadata } from "next";
import { getStores, searchStores } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchBox } from "@/components/search/SearchBox";
import { StoreListAZ } from "@/components/store/StoreListAZ";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "All Stores — Browse Verified Coupon Codes by Retailer",
  description:
    "Browse our complete directory of stores and find the newest verified coupon codes and deals.",
  path: "/stores",
});

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const stores = q ? await searchStores(q) : await getStores();

  return (
    <Container className="py-10">
      <Breadcrumb items={[{ name: "Stores", path: "/stores" }]} />

      <div className="mt-4">
        <h1 className="font-heading text-3xl font-bold text-brand-950">All stores</h1>
        <p className="mt-2 text-muted-600">
          Browse our complete directory of stores and find the newest deals.
        </p>
      </div>

      <div className="mt-6 max-w-md">
        <SearchBox
          defaultValue={q}
          placeholder="Search stores..."
          action="/stores"
        />
      </div>

      <div className="mt-8">
        {stores.length === 0 ? (
          <EmptyState
            title="No stores found"
            description="Try a different search term or browse all stores."
          />
        ) : (
          <StoreListAZ stores={stores} />
        )}
      </div>
    </Container>
  );
}
