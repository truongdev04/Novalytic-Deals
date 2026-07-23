import type { NextRequest } from "next/server";
import { previewAutoFillImport } from "@/lib/data";
import { parseAutoFillWorkbook, MAX_WORKBOOK_SIZE_BYTES } from "@/lib/parseAutoFillWorkbook";
import { jsonError, jsonOk } from "@/lib/server/api/response";

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) return jsonError(400, "No file provided");
  if (!file.name.toLowerCase().endsWith(".xlsx")) return jsonError(400, "File must be a .xlsx file");
  if (file.size > MAX_WORKBOOK_SIZE_BYTES) return jsonError(400, "File must be smaller than 10MB");

  let parsed;
  try {
    parsed = parseAutoFillWorkbook(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    return jsonError(400, err instanceof Error ? err.message : "Could not read this file.");
  }

  const result = await previewAutoFillImport(parsed);
  return jsonOk(result);
}
