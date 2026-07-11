import type { NextRequest } from "next/server";
import { getAuthors, createAuthor } from "@/lib/data";
import { adminAuthorFieldsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET() {
  const authors = await getAuthors();
  return jsonOk(authors);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = adminAuthorFieldsSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid author data");

  const author = await createAuthor(parsed.data);
  return jsonOk(author);
}
