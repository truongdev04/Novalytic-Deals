import type { NextRequest } from "next/server";
import {
  deleteDeal,
  getDealById,
  setDealActive,
  setDealEvent,
  setDealFeatured,
  updateDeal,
} from "@/lib/data";
import { adminDealSchema } from "@/lib/validators/admin/deal";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDealById(id);
  if (!deal) return jsonError(404, "Deal not found");
  return jsonOk(deal);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick toggle from the list page sends only one field ({isFeatured} /
  // {isActive} / {eventId}); the full edit form sends the complete
  // adminDealSchema shape.
  const fullUpdate = adminDealSchema.safeParse(body);
  if (fullUpdate.success) {
    try {
      const deal = await updateDeal(id, {
        storeId: fullUpdate.data.storeId,
        slug: fullUpdate.data.slug,
        name: fullUpdate.data.name,
        type: fullUpdate.data.type,
        code: fullUpdate.data.code || null,
        eventId: fullUpdate.data.eventId,
        categoryId: fullUpdate.data.categoryId,
        originalPrice: fullUpdate.data.originalPrice ?? null,
        price: fullUpdate.data.price,
        offer: fullUpdate.data.offer || null,
        url: fullUpdate.data.url,
        imageUrl: fullUpdate.data.imageUrl,
        description: fullUpdate.data.description || null,
        isFeatured: fullUpdate.data.isFeatured,
      });
      return jsonOk(deal);
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        return jsonError(409, "This slug is already in use. Please choose another one.");
      }
      return jsonError(500, "Failed to save deal");
    }
  }

  if (typeof body?.isFeatured === "boolean") {
    const deal = await setDealFeatured(id, body.isFeatured);
    return jsonOk(deal);
  }

  if (typeof body?.isActive === "boolean") {
    try {
      const deal = await setDealActive(id, body.isActive);
      return jsonOk(deal);
    } catch (error) {
      if (error instanceof Error && error.message === "STORE_INACTIVE") {
        return jsonError(409, "Cannot activate: the store is currently inactive.");
      }
      return jsonError(500, "Failed to update deal");
    }
  }

  if (body && Object.prototype.hasOwnProperty.call(body, "eventId")) {
    if (body.eventId !== null && typeof body.eventId !== "string") {
      return jsonError(400, "Invalid deal data");
    }
    const deal = await setDealEvent(id, body.eventId);
    return jsonOk(deal);
  }

  return jsonError(400, "Invalid deal data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteDeal(id);
  return jsonOk({ deleted: true });
}
