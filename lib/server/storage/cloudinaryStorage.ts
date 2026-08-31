import { v2 as cloudinary } from "cloudinary";
import { getEffectiveCloudinaryConfig } from "@/lib/data/settings";

export async function isCloudinaryConfigured() {
  const config = await getEffectiveCloudinaryConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

export async function uploadToCloudinary(
  path: string,
  file: File,
  options?: { format?: string }
): Promise<string> {
  const config = await getEffectiveCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error("Cloudinary isn't configured");
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  // Cloudinary keeps `public_id` verbatim and appends the detected format to
  // the delivery URL — if `path` already ends in an extension (e.g.
  // "stores/abc.png"), the result doubles up (".../stores/abc.png.jpg").
  // Strip it here and use it as the default `format` instead.
  const lastSlash = path.lastIndexOf("/");
  const lastDot = path.lastIndexOf(".");
  const hasExtension = lastDot > lastSlash;
  const publicId = hasExtension ? path.slice(0, lastDot) : path;
  const inferredFormat = hasExtension ? path.slice(lastDot + 1) : undefined;

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    overwrite: true,
    format: options?.format ?? inferredFormat,
  });
  return result.secure_url;
}
