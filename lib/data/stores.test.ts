import { describe, expect, it, vi, beforeEach } from "vitest";

const purgeTag = vi.fn();
const storeFindUnique = vi.fn();
const storeUpdate = vi.fn();

vi.mock("@/lib/server/cache/purgeTag", () => ({ purgeTag }));
vi.mock("@/lib/server/db", () => ({
  prisma: {
    store: {
      findUnique: (...args: unknown[]) => storeFindUnique(...args),
      update: (...args: unknown[]) => storeUpdate(...args),
    },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const { updateStore } = await import("./stores");

const baseFields = {
  slug: "new-slug",
  name: "Store",
  logoUrl: "",
  bannerUrl: "",
  website: "https://example.com",
  description: "",
  aboutStore: "",
  howToApply: "",
  rating: 0,
  ratingCount: 0,
  region: "US",
  affiliateNetwork: "",
  isFeatured: false,
  isPin: false,
  seo: { title: "", description: "" },
  faq: [],
  categoryIds: [],
} as Parameters<typeof updateStore>[1];

describe("updateStore cache invalidation", () => {
  beforeEach(() => {
    purgeTag.mockClear();
    storeFindUnique.mockReset();
    storeUpdate.mockReset();
  });

  it("purges both the old and new slug tags when the slug changes", async () => {
    storeFindUnique.mockResolvedValue({ slug: "old-slug" });
    storeUpdate.mockResolvedValue({
      ...baseFields,
      id: "1",
      slug: "new-slug",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await updateStore("1", { ...baseFields, slug: "new-slug" });

    expect(purgeTag).toHaveBeenCalledWith("stores:list");
    expect(purgeTag).toHaveBeenCalledWith("store:new-slug");
    expect(purgeTag).toHaveBeenCalledWith("store:old-slug");
  });

  it("does not purge a stale-slug tag when the slug is unchanged", async () => {
    storeFindUnique.mockResolvedValue({ slug: "same-slug" });
    storeUpdate.mockResolvedValue({
      ...baseFields,
      id: "1",
      slug: "same-slug",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await updateStore("1", { ...baseFields, slug: "same-slug" });

    expect(purgeTag).toHaveBeenCalledWith("store:same-slug");
    expect(purgeTag).toHaveBeenCalledTimes(2);
  });
});
