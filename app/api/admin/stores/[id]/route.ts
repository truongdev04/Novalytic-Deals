import type { NextRequest } from "next/server";
import {
  deleteStore,
  getStoreById,
  setStoreActive,
  setStoreEvent,
  setStoreFeatured,
  updateStore,
} from "@/lib/data";
import { adminStoreSchema } from "@/lib/validators/admin/store";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStoreById(id);
  if (!store) return jsonError(404, "Store not found");
  return jsonOk(store);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick toggle from the list page sends only { isFeatured }; the full
  // edit form sends the complete adminStoreSchema shape.
  const fullUpdate = adminStoreSchema.safeParse(body);
  if (fullUpdate.success) {
    // Region/rating/ratingCount aren't editable from this form — carry the
    // existing values through untouched instead of clobbering them.
    const existing = await getStoreById(id);
    if (!existing) return jsonError(404, "Store not found");

    try {
      const store = await updateStore(id, {
        slug: fullUpdate.data.slug,
        name: fullUpdate.data.name,
        logoUrl: fullUpdate.data.logoUrl,
        bannerUrl: fullUpdate.data.bannerUrl || null,
        website: fullUpdate.data.website,
        description: fullUpdate.data.description,
        aboutStore: fullUpdate.data.aboutStore,
        howToApply: fullUpdate.data.howToApply || null,
        rating: existing.rating,
        ratingCount: existing.ratingCount,
        region: existing.region,
        affiliateNetwork: fullUpdate.data.affiliateNetwork,
        categoryIds: fullUpdate.data.categoryIds,
        isFeatured: fullUpdate.data.isFeatured,
        seo: { title: fullUpdate.data.seoTitle, description: fullUpdate.data.seoDescription },
        faq: fullUpdate.data.faq,
      });
      await setStoreEvent(id, fullUpdate.data.eventId);
      return jsonOk(store);
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        return jsonError(409, "This slug is already in use. Please choose another one.");
      }
      return jsonError(500, "Failed to save store");
    }
  }

  if (typeof body?.isFeatured === "boolean") {
    const store = await setStoreFeatured(id, body.isFeatured);
    return jsonOk(store);
  }

  if (typeof body?.isActive === "boolean") {
    const store = await setStoreActive(id, body.isActive);
    return jsonOk(store);
  }

  if (body && Object.prototype.hasOwnProperty.call(body, "eventId")) {
    if (body.eventId !== null && typeof body.eventId !== "string") {
      return jsonError(400, "Invalid store data");
    }
    await setStoreEvent(id, body.eventId);
    return jsonOk({ updated: true });
  }

  return jsonError(400, "Invalid store data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteStore(id);
  return jsonOk({ deleted: true });
}
