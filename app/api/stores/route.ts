import type { NextRequest } from "next/server";
import { getStores, searchStores } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const stores = q ? await searchStores(q) : await getStores();
  return jsonOk(stores);
}
