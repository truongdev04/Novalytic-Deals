import type { NextRequest } from "next/server";
import { createDeal, getAllDeals } from "@/lib/data";
import { adminDealSchema } from "@/lib/validators/admin/deal";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const deals = await getAllDeals();
  return jsonOk(deals);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminDealSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid deal data");

  try {
    const deal = await createDeal({
      storeId: parsed.data.storeId,
      slug: parsed.data.slug,
      name: parsed.data.name,
      type: parsed.data.type,
      code: parsed.data.code || null,
      eventId: parsed.data.eventId,
      categoryId: parsed.data.categoryId,
      originalPrice: parsed.data.originalPrice ?? null,
      price: parsed.data.price,
      offer: parsed.data.offer || null,
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl,
      description: parsed.data.description || null,
      isFeatured: parsed.data.isFeatured,
    });
    return jsonOk(deal, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return jsonError(409, "This slug is already in use. Please choose another one.");
    }
    return jsonError(500, "Failed to save deal");
  }
}
