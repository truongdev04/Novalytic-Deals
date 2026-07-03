import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { jsonError, jsonOk } from "@/lib/server/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/server/api/withRateLimit";
import { uploadRateLimit } from "@/lib/server/cache/rateLimit";
import { isStorageConfigured, uploadPublicFile } from "@/lib/server/storage/supabaseStorage";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/server/storage/cloudinaryStorage";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const PROVIDERS = ["cloudinary", "supabase"] as const;
type Provider = (typeof PROVIDERS)[number];

export async function POST(request: NextRequest) {
  const session = await auth();
  const identifier = session?.user?.email ?? getClientIp(request);
  const rateLimited = await enforceRateLimit(uploadRateLimit, identifier);
  if (rateLimited) return rateLimited;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const providerRaw = formData?.get("provider");
  const format = formData?.get("format");
  const provider: Provider = PROVIDERS.includes(providerRaw as Provider)
    ? (providerRaw as Provider)
    : "cloudinary";

  if (!file || !(file instanceof File)) return jsonError(400, "No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) return jsonError(400, "Unsupported image type");
  if (file.size > MAX_SIZE_BYTES) return jsonError(400, "Image must be smaller than 5MB");

  if (provider === "cloudinary" && !isCloudinaryConfigured()) {
    return jsonError(
      500,
      "Cloudinary isn't configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    );
  }
  if (provider === "supabase" && !isStorageConfigured()) {
    return jsonError(
      500,
      "Supabase Storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `stores/${crypto.randomUUID()}.${extension}`;

  try {
    const url =
      provider === "cloudinary"
        ? await uploadToCloudinary(path, file, { format: typeof format === "string" ? format : undefined })
        : await uploadPublicFile(path, file);
    return jsonOk({ url });
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Upload failed");
  }
}
