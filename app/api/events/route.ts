import { getEvents } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const events = await getEvents();
  return jsonOk(events);
}
