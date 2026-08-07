import { getEvents } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const events = await getEvents();
  return jsonOk(events);
}
