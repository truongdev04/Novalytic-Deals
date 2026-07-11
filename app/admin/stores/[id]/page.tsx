import { notFound } from "next/navigation";
import { getCategories, getEvents, getStoreById, getContentConfigSettings } from "@/lib/data";
import { resolveStoreDiscountLabel } from "@/lib/content/storeSeoSnapshot";
import { StoreForm } from "@/components/admin/StoreForm";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [store, categories, events, contentConfig] = await Promise.all([
    getStoreById(id),
    getCategories(),
    getEvents(),
    getContentConfigSettings(),
  ]);
  if (!store) notFound();

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
        />
      </div>
    </div>
  );
}
