import type { NextRequest } from "next/server";
import { deleteReview, setReviewApproved } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.isApproved !== "boolean") return jsonError(400, "isApproved must be boolean");

  const review = await setReviewApproved(id, body.isApproved);
  return jsonOk(review);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteReview(id);
  return jsonOk({ deleted: true });
}
