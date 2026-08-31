import type { NextRequest } from "next/server";
import { deleteReviewsByStore, markStoreReviewsRead } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

// Mark every review of a store as seen — fired when an admin opens the
// store's review detail page.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  await markStoreReviewsRead(storeId);
  return jsonOk({ ok: true });
}

// Delete every review of a store at once (the trash action on the grouped
// review list).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const deleted = await deleteReviewsByStore(storeId);
  return jsonOk({ deleted });
}
