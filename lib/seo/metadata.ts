import type { Metadata } from "next";
import { getGeneralSettings } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://novalyticdeals.com";

export function resolveImageUrl(image: string): string {
  return image.startsWith("http") ? image : `${siteUrl}${image}`;
}

export async function buildMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Promise<Metadata> {
  const url = `${siteUrl}${path}`;
  const resolvedImage = image || (await getGeneralSettings()).ogImage;
  const imageUrl = resolvedImage ? resolveImageUrl(resolvedImage) : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
