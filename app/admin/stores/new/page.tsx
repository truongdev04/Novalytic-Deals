import { getCategories, getEvents, getContentConfigSettings } from "@/lib/data";
import { StoreForm } from "@/components/admin/StoreForm";

export default async function NewStorePage() {
  const [categories, events, contentConfig] = await Promise.all([
    getCategories(),
    getEvents(),
    getContentConfigSettings(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New store</h1>
      <div className="mt-6">
        <StoreForm categories={categories} events={events} templates={contentConfig.templates} />
      </div>
    </div>
  );
}
