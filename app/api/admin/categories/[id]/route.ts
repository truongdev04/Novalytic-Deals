import type { NextRequest } from "next/server";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/data";
import { adminCategorySchema } from "@/lib/validators/admin/category";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) return jsonError(404, "Category not found");
  return jsonOk(category);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminCategorySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid category data");

  const category = await updateCategory(id, {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description,
    iconName: parsed.data.iconName,
    parentId: parsed.data.parentId || null,
    isFeatured: parsed.data.isFeatured,
    seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
  });

  return jsonOk(category);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteCategory(id);
  return jsonOk({ deleted: true });
}
