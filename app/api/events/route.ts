import { getEvents } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  const events = await getEvents();
  return jsonOk(events);
}
