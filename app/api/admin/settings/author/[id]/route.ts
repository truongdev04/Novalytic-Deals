import type { NextRequest } from "next/server";
import { getAuthorById, updateAuthor, setAuthorDefault, deleteAuthor } from "@/lib/data";
import { adminAuthorFieldsSchema } from "@/lib/validators/admin/settings";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getAuthorById(id);
  if (!author) return jsonError(404, "Author not found");
  return jsonOk(author);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Quick "Default" toggle from the list page sends only { isDefault }; the
  // full edit form sends the complete adminAuthorFieldsSchema shape.
  const fullUpdate = adminAuthorFieldsSchema.safeParse(body);
  if (fullUpdate.success) {
    const author = await updateAuthor(id, fullUpdate.data);
    if (!author) return jsonError(404, "Author not found");
    return jsonOk(author);
  }

  if (typeof body?.isDefault === "boolean") {
    const author = await setAuthorDefault(id, body.isDefault);
    if (!author) return jsonError(404, "Author not found");
    return jsonOk(author);
  }

  return jsonError(400, "Invalid author data");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteAuthor(id);
  return jsonOk({ deleted: true });
}
