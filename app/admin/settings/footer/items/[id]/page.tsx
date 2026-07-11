import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getFooterItemById } from "@/lib/data";
import { FooterItemForm } from "@/components/admin/FooterItemForm";

export default async function EditFooterItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Edit Item</h1>
        <p className="mt-4 text-sm text-muted-500">Only admins can edit footer settings.</p>
      </div>
    );
  }

  const { id } = await params;
  const result = await getFooterItemById(id);
  if (!result) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">
        Edit {result.item.name || "item"}
      </h1>
      <p className="mt-1 text-sm text-muted-500">{result.type.toLowerCase()} item.</p>

      <div className="mt-6">
        <FooterItemForm
          settings={result.settings}
          columnIndex={result.columnIndex}
          type={result.type}
          item={result.item}
        />
      </div>
    </div>
  );
}
