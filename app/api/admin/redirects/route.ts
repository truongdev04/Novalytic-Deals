import type { NextRequest } from "next/server";
import { createRedirectRule, getAllRedirectRules } from "@/lib/data";
import { adminRedirectRuleSchema } from "@/lib/validators/admin/redirectRule";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const rules = await getAllRedirectRules();
  return jsonOk(rules);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminRedirectRuleSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid redirect rule data");

  try {
    const rule = await createRedirectRule(parsed.data);
    return jsonOk(rule, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_TAKEN") {
      return jsonError(409, "This source path already has a redirect rule.");
    }
    return jsonError(500, "Failed to save redirect rule");
  }
}
