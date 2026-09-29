import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAllStores, getCategories, getDealById, getDealOwnerId, getEvents } from "@/lib/data";
import { DealForm } from "@/components/admin/DealForm";
import { isDataScoped } from "@/lib/permissions";

export default async function EditDealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const returnUrl = from && from.startsWith("/admin/deals") ? from : "/admin/deals";
  const session = await auth();
  const scoped = isDataScoped(session?.user?.role, session?.user?.fullDataAccess, "deals");
  const [deal, ownerId, stores, events, categories] = await Promise.all([
    getDealById(id),
    scoped ? getDealOwnerId(id) : Promise.resolve(undefined),
    getAllStores(),
    getEvents(),
    getCategories(),
  ]);
  if (!deal) notFound();
  if (scoped && ownerId !== session?.user?.id) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit deal</h1>
      <div className="mt-6">
        <DealForm
          deal={deal}
          stores={stores}
          events={events}
          categories={categories}
          returnUrl={returnUrl}
        />
      </div>
    </div>
  );
}
