import type { NextRequest } from "next/server";
import {
  updateSubmittedCoupon,
  updateSubmittedCouponStatus,
  deleteSubmittedCoupon,
} from "@/lib/data";
import { adminSubmittedCouponSchema } from "@/lib/validators/admin/submittedCoupon";
import { jsonError, jsonOk } from "@/lib/server/api/response";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick action from the list (approve/reject) sends only { status }; the
  // edit page sends the full adminSubmittedCouponSchema shape.
  if (typeof body?.status === "string" && Object.keys(body).length === 1) {
    if (!VALID_STATUSES.includes(body.status)) return jsonError(400, "Invalid status");
    const submission = await updateSubmittedCouponStatus(id, body.status);
    return jsonOk(submission);
  }

  const parsed = adminSubmittedCouponSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid submission data");

  const submission = await updateSubmittedCoupon(id, {
    title: parsed.data.title,
    storeName: parsed.data.storeName,
    websiteUrl: parsed.data.websiteUrl,
    code: parsed.data.code || undefined,
    discountUnit: parsed.data.discountUnit,
    discountValue: parsed.data.discountValue,
    description: parsed.data.description,
    expiresAt: parsed.data.expiresAt || undefined,
    submitterEmail: parsed.data.submitterEmail,
  });
  return jsonOk(submission);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteSubmittedCoupon(id);
  return jsonOk({ deleted: true });
}
