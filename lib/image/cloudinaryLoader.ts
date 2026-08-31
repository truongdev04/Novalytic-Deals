// Global next/image loader (wired via next.config.ts `images.loaderFile`).
//
// Cloudinary is a dedicated image CDN that resizes + reformats via URL, so
// routing our Cloudinary-hosted images (store logos, deal images, some blog
// covers — see the admin upload flow) through Vercel's Image Optimization is
// paying twice: one Vercel "source image" + a Fast Origin Transfer fetch of
// the original, for a transform Cloudinary does for free.
//
// This keeps next/image's responsive behaviour intact — it still builds a
// srcSet across widths, each entry just points straight at Cloudinary with
// the matching `w_<width>`, and the browser picks by `sizes` + DPR.
//
// Everything else — local /images/*.svg, a pasted external URL, Supabase
// Storage — is returned untouched: served as-is at its natural size. (Our
// non-Cloudinary images are all vector SVG, which Vercel wasn't optimising
// anyway.)
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const marker = "/upload/";
  if (!src.includes("res.cloudinary.com") || !src.includes(marker)) return src;

  // Don't stack a second transform if the URL already carries one (e.g. an
  // older record saved with a baked-in transform like `/upload/w_200/…`).
  const afterUpload = src.slice(src.indexOf(marker) + marker.length);
  if (/^[a-z]{1,3}_[^/]+\//.test(afterUpload)) return src;

  const transform = `c_limit,w_${width},q_${quality ?? "auto"},f_auto`;
  return src.replace(marker, `${marker}${transform}/`);
}
