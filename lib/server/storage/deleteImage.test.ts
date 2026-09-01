import { describe, expect, it, vi } from "vitest";

const destroy = vi.fn().mockResolvedValue(undefined);
const removeFile = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/server/storage/cloudinaryStorage", () => ({
  deleteFromCloudinary: (publicId: string) => destroy(publicId),
}));
vi.mock("@/lib/server/storage/supabaseStorage", () => ({
  SUPABASE_PUBLIC_URL_MARKER: "/storage/v1/object/public/store-assets/",
  deletePublicFile: (path: string) => removeFile(path),
}));

const { deleteUploadedImage, removedImageUrls } = await import("./deleteImage");

describe("deleteUploadedImage", () => {
  it("extracts the Cloudinary public_id from a plain delivery URL", async () => {
    destroy.mockClear();
    await deleteUploadedImage(
      "https://res.cloudinary.com/demo/image/upload/v1699999999/stores/abc-123.webp"
    );
    expect(destroy).toHaveBeenCalledWith("stores/abc-123");
  });

  it("strips leading transform + signature segments", async () => {
    destroy.mockClear();
    await deleteUploadedImage(
      "https://res.cloudinary.com/demo/image/upload/s--AbC12--/c_limit,w_400/v123/stores/abc.jpg"
    );
    expect(destroy).toHaveBeenCalledWith("stores/abc");
  });

  it("extracts the Supabase storage path", async () => {
    removeFile.mockClear();
    await deleteUploadedImage(
      "https://xyz.supabase.co/storage/v1/object/public/store-assets/stores/def-456.png"
    );
    expect(removeFile).toHaveBeenCalledWith("stores/def-456.png");
  });

  it("ignores external / local / empty values", async () => {
    destroy.mockClear();
    removeFile.mockClear();
    await deleteUploadedImage("https://example.com/logo.png");
    await deleteUploadedImage("/images/hero/home-hero.svg");
    await deleteUploadedImage("");
    await deleteUploadedImage(null);
    expect(destroy).not.toHaveBeenCalled();
    expect(removeFile).not.toHaveBeenCalled();
  });

  it("never throws when the underlying delete fails", async () => {
    destroy.mockClear();
    destroy.mockRejectedValueOnce(new Error("network"));
    await expect(
      deleteUploadedImage("https://res.cloudinary.com/demo/image/upload/stores/x.webp")
    ).resolves.toBeUndefined();
  });
});

describe("removedImageUrls", () => {
  it("returns old values that were replaced or cleared", () => {
    const before = { logoUrl: "https://cdn/a.png", bannerUrl: "https://cdn/b.png" };
    const after = { logoUrl: "https://cdn/a2.png", bannerUrl: "" };
    expect(removedImageUrls(before, after, ["logoUrl", "bannerUrl"])).toEqual([
      "https://cdn/a.png",
      "https://cdn/b.png",
    ]);
  });

  it("ignores unchanged and newly-added fields", () => {
    const before = { logoUrl: "https://cdn/a.png", ogImage: "" };
    const after = { logoUrl: "https://cdn/a.png", ogImage: "https://cdn/og.png" };
    expect(removedImageUrls(before, after, ["logoUrl", "ogImage"])).toEqual([]);
  });

  it("returns nothing when there is no previous record", () => {
    expect(removedImageUrls(null, { logoUrl: "x" }, ["logoUrl"])).toEqual([]);
  });
});
