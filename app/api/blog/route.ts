import { getBlogPosts } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const posts = await getBlogPosts();
  return jsonOk(posts);
}
