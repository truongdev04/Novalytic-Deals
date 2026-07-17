import { refreshDealsNow } from "@/lib/content/dealsRefresh";
import { jsonOk } from "@/lib/server/api/response";

export async function POST() {
  const result = await refreshDealsNow();
  return jsonOk(result);
}
