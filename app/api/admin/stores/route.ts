import type { NextRequest } from "next/server";
import { createStore, getAllStores, setStoreEvent } from "@/lib/data";
import { adminStoreSchema } from "@/lib/validators/admin/store";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const stores = await getAllStores();
  return jsonOk(stores);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminStoreSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid store data");

  const store = await createStore({
    slug: parsed.data.slug,
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl,
    bannerUrl: parsed.data.bannerUrl || null,
    website: parsed.data.website,
    description: parsed.data.description,
    aboutStore: parsed.data.aboutStore,
    howToApply: parsed.data.howToApply || null,
    // Region/rating aren't collected from the admin form anymore — every new
    // store starts global with a fresh 5.0 rating and a plausible seed count.
    rating: 5,
    ratingCount: Math.floor(Math.random() * 1000) + 1,
    region: "GLOBAL",
    affiliateNetwork: parsed.data.affiliateNetwork,
    categoryIds: parsed.data.categoryIds,
    isFeatured: parsed.data.isFeatured,
    seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
    faq: parsed.data.faq,
  });

  if (parsed.data.eventId) {
    await setStoreEvent(store.id, parsed.data.eventId);
  }

  return jsonOk(store, 201);
}
