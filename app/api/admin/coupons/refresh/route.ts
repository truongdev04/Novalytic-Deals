import { refreshCouponsNow } from "@/lib/content/couponsRefresh";
import { jsonOk } from "@/lib/server/api/response";

export async function POST() {
  const result = await refreshCouponsNow();
  return jsonOk(result);
}
