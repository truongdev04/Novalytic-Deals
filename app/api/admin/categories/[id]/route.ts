import type { NextRequest } from "next/server";
import { deleteCategory, getCategoryById, setCategoryFeatured, updateCategory } from "@/lib/data";
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

  // Quick toggle from the list page sends only { isFeatured };
  // the full edit form sends the complete adminCategorySchema shape.
  const fullUpdate = adminCategorySchema.safeParse(body);
  if (fullUpdate.success) {
    try {
      const category = await updateCategory(id, {
        slug: fullUpdate.data.slug,
        name: fullUpdate.data.name,
        description: fullUpdate.data.description,
        iconName: fullUpdate.data.iconName || null,
        iconImageUrl: fullUpdate.data.iconImageUrl || null,
        parentId: fullUpdate.data.parentId || null,
        isFeatured: fullUpdate.data.isFeatured,
        seo: { title: fullUpdate.data.seoTitle, description: fullUpdate.data.seoDescription },
      });
      return jsonOk(category);
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        return jsonError(409, "This slug is already in use. Please choose another one.");
      }
      return jsonError(500, "Failed to save category");
    }
  }

  if (typeof body?.isFeatured === "boolean") {
    const category = await setCategoryFeatured(id, body.isFeatured);
    return jsonOk(category);
  }

  return jsonError(400, "Invalid category data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteCategory(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_IN_USE") {
      return jsonError(
        409,
        "Cannot delete this category because it still has stores assigned to it. Remove it from those stores first."
      );
    }
    return jsonError(500, "Failed to delete category");
  }
}
