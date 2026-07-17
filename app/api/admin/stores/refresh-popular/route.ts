import { refreshPopularStoresNow } from "@/lib/content/popularStoresRefresh";
import { jsonOk } from "@/lib/server/api/response";

export async function POST() {
  const result = await refreshPopularStoresNow();
  return jsonOk(result);
}
