import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { createCategory, getCategories } from "@/lib/data";
import { adminCategorySchema } from "@/lib/validators/admin/category";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const categories = await getCategories();
  return jsonOk(categories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return jsonError(401, "Unauthorized");

  const body = await request.json().catch(() => null);
  const parsed = adminCategorySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid category data");

  try {
    const category = await createCategory({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      iconName: parsed.data.iconName || null,
      iconImageUrl: parsed.data.iconImageUrl || null,
      parentId: parsed.data.parentId || null,
      isFeatured: parsed.data.isFeatured,
      seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
      createdById: session.user.id,
    });
    return jsonOk(category, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return jsonError(409, "This slug is already in use. Please choose another one.");
    }
    return jsonError(500, "Failed to save category");
  }
}
