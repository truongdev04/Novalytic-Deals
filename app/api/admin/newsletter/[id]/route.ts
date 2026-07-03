import type { NextRequest } from "next/server";
import { deleteNewsletterSubscriber, unsubscribeNewsletterSubscriberById } from "@/lib/data";
import { jsonOk } from "@/lib/server/api/response";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await unsubscribeNewsletterSubscriberById(id);
  return jsonOk({ unsubscribed: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteNewsletterSubscriber(id);
  return jsonOk({ deleted: true });
}
