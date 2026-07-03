import { getBlogPosts } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const posts = await getBlogPosts();
  return jsonOk(posts);
}
