import type { NextRequest } from "next/server";
import {
  deleteRedirectRule,
  getRedirectRuleById,
  setRedirectRuleActive,
  updateRedirectRule,
} from "@/lib/data";
import { adminRedirectRuleSchema } from "@/lib/validators/admin/redirectRule";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await getRedirectRuleById(id);
  if (!rule) return jsonError(404, "Redirect rule not found");
  return jsonOk(rule);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick toggle from the list page sends only { isActive }; the full edit
  // form sends the complete adminRedirectRuleSchema shape.
  const fullUpdate = adminRedirectRuleSchema.safeParse(body);
  if (fullUpdate.success) {
    try {
      const rule = await updateRedirectRule(id, fullUpdate.data);
      return jsonOk(rule);
    } catch (error) {
      if (error instanceof Error && error.message === "SOURCE_TAKEN") {
        return jsonError(409, "This source path already has a redirect rule.");
      }
      return jsonError(500, "Failed to save redirect rule");
    }
  }

  if (typeof body?.isActive === "boolean") {
    const rule = await setRedirectRuleActive(id, body.isActive);
    return jsonOk(rule);
  }

  return jsonError(400, "Invalid redirect rule data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteRedirectRule(id);
  return jsonOk({ deleted: true });
}
