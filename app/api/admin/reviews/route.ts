import { getAllReviews } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const reviews = await getAllReviews();
  return jsonOk(reviews);
}
