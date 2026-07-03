import { getNewsletterSubscribers } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const subscribers = await getNewsletterSubscribers();
  return jsonOk(subscribers);
}
