import { getSubmittedCoupons } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const submissions = await getSubmittedCoupons();
  return jsonOk(submissions);
}
