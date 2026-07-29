import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getCategories,
  getEvents,
  getStoreById,
  getStoreOwnerId,
  getContentConfigSettings,
} from "@/lib/data";
import { resolveStoreDiscountLabel } from "@/lib/content/storeSeoSnapshot";
import { StoreForm } from "@/components/admin/StoreForm";
import { isDataScoped } from "@/lib/permissions";

export default async function EditStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const returnUrl = from && from.startsWith("/admin/stores") ? from : "/admin/stores";
  const session = await auth();
  const scoped = isDataScoped(session?.user?.role, session?.user?.fullDataAccess, "stores");
  const [store, ownerId, categories, events, contentConfig] = await Promise.all([
    getStoreById(id),
    scoped ? getStoreOwnerId(id) : Promise.resolve(undefined),
    getCategories(),
    getEvents(),
    getContentConfigSettings(),
  ]);
  if (!store) notFound();
  if (scoped && ownerId !== session?.user?.id) notFound();

  // Real (frozen-for-the-month) {discount} value, purely for the SEO
  // title/description placeholder preview below — never written into the
  // store's actual saved fields, same as every other auto-fill preview here.
  const discountLabel = await resolveStoreDiscountLabel(store);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit store</h1>
      <div className="mt-6">
        <StoreForm
          store={store}
          categories={categories}
          events={events}
          templates={contentConfig.templates}
          discountLabel={discountLabel}
          returnUrl={returnUrl}
        />
      </div>
    </div>
  );
}
