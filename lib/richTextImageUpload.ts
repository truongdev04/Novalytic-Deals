// Images inserted into a RichTextEditor are only previewed locally (as an
// object URL) while the admin is editing — they're uploaded to Cloudinary
// (converted to .webp) only once the store form is actually submitted, so a
// draft that's never saved never orphans an image on Cloudinary.
const pendingUploads = new Map<string, File>();

export function registerPendingImage(file: File): string {
  const id = crypto.randomUUID();
  pendingUploads.set(id, file);
  return id;
}

export async function resolveRichTextImages(html: string): Promise<string> {
  if (!html.includes("data-pending-upload")) return html;

  const container = document.createElement("div");
  container.innerHTML = html;
  const pendingImages = Array.from(container.querySelectorAll('img[data-pending-upload="true"]'));

  await Promise.all(
    pendingImages.map(async (img) => {
      const uploadId = img.getAttribute("data-upload-id");
      const file = uploadId ? pendingUploads.get(uploadId) : undefined;
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", "cloudinary");
      formData.append("format", "webp");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data?.url) {
        throw new Error(body?.error || "Image upload failed");
      }

      img.setAttribute("src", body.data.url);
      img.removeAttribute("data-pending-upload");
      img.removeAttribute("data-upload-id");
      if (uploadId) pendingUploads.delete(uploadId);
    })
  );

  return container.innerHTML;
}
