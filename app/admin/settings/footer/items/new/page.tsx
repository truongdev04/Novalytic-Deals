import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getFooterSettings } from "@/lib/data";
import { FooterItemForm } from "@/components/admin/FooterItemForm";

export default async function NewFooterItemPage({
  searchParams,
}: {
  searchParams: Promise<{ columnIndex?: string }>;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Add Item</h1>
        <p className="mt-4 text-sm text-muted-500">Only admins can edit footer settings.</p>
      </div>
    );
  }

  const { columnIndex: columnIndexParam } = await searchParams;
  const columnIndex = Number(columnIndexParam);
  const settings = await getFooterSettings();
  const column = settings.columns[columnIndex];
  if (!column || Number.isNaN(columnIndex)) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Add {column.title} item</h1>
      <p className="mt-1 text-sm text-muted-500">New {column.type.toLowerCase()} item.</p>

      <div className="mt-6">
        <FooterItemForm settings={settings} columnIndex={columnIndex} type={column.type} />
      </div>
    </div>
  );
}
