import type { NextRequest } from "next/server";
import { updateSubmittedCouponStatus } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/server/api/response";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) return jsonError(400, "Invalid status");

  const submission = await updateSubmittedCouponStatus(id, status);
  return jsonOk(submission);
}
