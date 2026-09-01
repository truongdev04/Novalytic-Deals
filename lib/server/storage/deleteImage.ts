import { deleteFromCloudinary } from "@/lib/server/storage/cloudinaryStorage";
import { SUPABASE_PUBLIC_URL_MARKER, deletePublicFile } from "@/lib/server/storage/supabaseStorage";

// Cleanup for images uploaded through /api/admin/upload when a dedicated
// image field (store logo/banner, deal image, blog cover, event/category
// icon+banner, site logo/favicon/OG, page banners) is replaced or its owner
// is deleted. Rich-text embedded images are intentionally NOT handled here —
// they're shared/duplicated across drafts and revisions, not owned 1:1 by a
// column, so tracking them isn't worth the complexity.
//
// Everything here is best-effort: a failed delete only leaks a file, it must
// never fail the surrounding save. Non-uploaded values (pasted external URLs,
// local /images/*.svg, empty strings) are left alone.

const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Recover the Cloudinary `public_id` from a delivery URL, e.g.
 * `https://res.cloudinary.com/demo/image/upload/v1699/stores/abc.webp`
 * → `stores/abc`. Leading signature / transformation / version segments
 * (which Cloudinary may inject) are stripped; our own uploads are just
 * `<folder>/<uuid>.<ext>`.
 */
function cloudinaryPublicId(url: string): string | null {
  const marker = "/upload/";
  const at = url.indexOf(marker);
  if (at === -1) return null;

  const rest = url.slice(at + marker.length).split(/[?#]/)[0];
  const segments = rest.split("/").filter(Boolean);

  while (segments.length > 1) {
    const seg = segments[0];
    const isVersion = /^v\d+$/.test(seg);
    const isSignature = /^s--[\w-]+--$/.test(seg);
    const isTransform = seg.includes(",") || /^[a-z]{1,3}_[^/]+$/.test(seg);
    if (isVersion || isSignature || isTransform) {
      segments.shift();
    } else {
      break;
    }
  }

  const path = segments.join("/");
  if (!path) return null;
  const lastDot = path.lastIndexOf(".");
  return lastDot > 0 ? path.slice(0, lastDot) : path;
}

function supabasePath(url: string): string | null {
  const at = url.indexOf(SUPABASE_PUBLIC_URL_MARKER);
  if (at === -1) return null;
  const raw = url.slice(at + SUPABASE_PUBLIC_URL_MARKER.length).split(/[?#]/)[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function deleteUploadedImage(url: string | null | undefined): Promise<void> {
  if (!url || typeof url !== "string") return;
  try {
    if (url.includes(CLOUDINARY_HOST)) {
      const publicId = cloudinaryPublicId(url);
      if (publicId) await deleteFromCloudinary(publicId);
      return;
    }
    const path = supabasePath(url);
    if (path) await deletePublicFile(path);
  } catch (err) {
    console.error("[deleteUploadedImage] failed to remove", url, err);
  }
}

export async function deleteUploadedImages(
  urls: ReadonlyArray<string | null | undefined>
): Promise<void> {
  await Promise.all(urls.map((url) => deleteUploadedImage(url)));
}

/**
 * Given the record as it was before an update and the fields being written,
 * return the image URLs that are being dropped (present before, now empty or
 * pointing somewhere else) so the caller can delete the old files.
 */
export function removedImageUrls<K extends string>(
  before: Partial<Record<K, unknown>> | null | undefined,
  after: Partial<Record<K, unknown>>,
  keys: readonly K[]
): string[] {
  if (!before) return [];
  const removed: string[] = [];
  for (const key of keys) {
    const oldValue = before[key];
    if (typeof oldValue !== "string" || !oldValue) continue;
    if (!(key in after)) continue;
    const newValue = after[key];
    if (oldValue !== newValue) removed.push(oldValue);
  }
  return removed;
}
