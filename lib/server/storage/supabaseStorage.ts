import { createClient } from "@supabase/supabase-js";

const BUCKET = "store-assets";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export function isStorageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function uploadPublicFile(path: string, file: File): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("Supabase Storage isn't configured");

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await client.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Marker that a public URL for this bucket always contains — used by
// lib/server/storage/deleteImage.ts to recover the storage path from a URL.
export const SUPABASE_PUBLIC_URL_MARKER = `/storage/v1/object/public/${BUCKET}/`;

// Best-effort delete. No-ops when Storage isn't configured.
export async function deletePublicFile(path: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
