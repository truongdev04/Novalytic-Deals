import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AdminStoreInput } from "@/lib/validators/admin/store";
import type { AdminCouponInput } from "@/lib/validators/admin/coupon";
import type { ParsedAutoFillWorkbook } from "@/lib/parseAutoFillWorkbook";

const getAllStores = vi.fn();
const getStoreBySlug = vi.fn();
const createStore = vi.fn();
const createCoupon = vi.fn();

vi.mock("./stores", () => ({ getAllStores, getStoreBySlug, createStore }));
vi.mock("./coupons", () => ({ createCoupon }));

const { commitAutoFillImport, previewAutoFillImport } = await import("./autoFillImport");

function storeInput(overrides: Partial<AdminStoreInput> & { slug: string; name: string }): AdminStoreInput {
  return {
    logoUrl: "",
    bannerUrl: "",
    website: "https://example.com",
    affiliateNetwork: "",
    categoryIds: [],
    eventId: null,
    description: "",
    aboutStore: "",
    howToApply: "",
    faq: [],
    isFeatured: false,
    isPin: false,
    seoTitle: "",
    seoDescription: "",
    ...overrides,
  };
}

function couponInput(
  overrides: Partial<Omit<AdminCouponInput, "storeId">> & { slug: string; title: string }
): Omit<AdminCouponInput, "storeId"> {
  return {
    description: "",
    type: "CODE",
    code: "SAVE10",
    discountType: "PERCENT",
    discountValue: 10,
    currency: "$",
    affiliateUrl: "https://example.com",
    exclusive: false,
    verified: true,
    terms: "",
    startsAt: "",
    expiresAt: "",
    isFeatured: false,
    ...overrides,
  };
}

// One brand-new store (never in DB) and one already-existing store, each with
// one coupon in the file — mirrors the shape parseAutoFillWorkbook() would
// hand off, but built by hand so tests don't depend on the xlsx parser.
function buildParsed(): ParsedAutoFillWorkbook {
  return {
    stores: [
      { row: 2, input: storeInput({ slug: "new-store", name: "New Store" }) },
      { row: 3, input: storeInput({ slug: "old-store", name: "Old Store" }) },
    ],
    storeErrors: [],
    coupons: [
      {
        row: 2,
        storeName: "New Store",
        storeSlug: "new-store",
        input: couponInput({ slug: "new-store-abc123", title: "10% off" }),
      },
      {
        row: 3,
        storeName: "Old Store",
        storeSlug: "old-store",
        input: couponInput({ slug: "old-store-def456", title: "Free shipping" }),
      },
    ],
    couponErrors: [],
    reviewNotes: [],
  };
}

describe("autoFillImport — reused stores skip their coupons", () => {
  beforeEach(() => {
    getAllStores.mockReset();
    getStoreBySlug.mockReset();
    createStore.mockReset();
    createCoupon.mockReset();
    // "old-store" already exists in the DB before this import runs.
    getAllStores.mockResolvedValue([{ slug: "old-store", id: "existing-1" }]);
    createStore.mockImplementation(async (fields: { slug: string }) => ({ id: "new-1", slug: fields.slug }));
    createCoupon.mockResolvedValue({ id: "coupon-1" });
  });

  it("commit: creates the coupon for a brand-new store but silently skips it for a reused store (not an error)", async () => {
    const result = await commitAutoFillImport(buildParsed(), "admin-1");

    expect(result.stores.created.map((s) => s.slug)).toEqual(["new-store"]);
    expect(result.stores.reused.map((s) => s.slug)).toEqual(["old-store"]);

    expect(result.coupons.created.map((c) => c.storeName)).toEqual(["New Store"]);
    // Skipping a reused store's coupon is expected/intentional, not an
    // error — must not show up in couponErrors.
    expect(result.coupons.errors).toHaveLength(0);

    // createCoupon must only have actually been called for the new store.
    expect(createCoupon).toHaveBeenCalledTimes(1);
    expect(createCoupon).toHaveBeenCalledWith(expect.objectContaining({ storeId: "new-1" }));
  });

  it("preview (dry run) matches commit's decision without writing anything", async () => {
    const result = await previewAutoFillImport(buildParsed());

    expect(result.coupons.created.map((c) => c.storeName)).toEqual(["New Store"]);
    expect(result.coupons.errors).toHaveLength(0);
    expect(createStore).not.toHaveBeenCalled();
    expect(createCoupon).not.toHaveBeenCalled();
  });

  it("commit: an unexpected store-creation error skips that store's coupon too, without aborting the batch", async () => {
    getAllStores.mockResolvedValue([]); // neither store pre-exists this time
    createStore.mockImplementation(async (fields: { slug: string }) => {
      if (fields.slug === "old-store") throw new Error("connection reset");
      return { id: "new-1", slug: fields.slug };
    });

    const result = await commitAutoFillImport(buildParsed(), "admin-1");

    expect(result.stores.created.map((s) => s.slug)).toEqual(["new-store"]);
    expect(result.stores.reused).toHaveLength(0);
    expect(result.stores.errors).toHaveLength(1);
    expect(result.stores.errors[0]).toMatchObject({ name: "Old Store", message: "connection reset" });

    // Batch kept going — the other store still got created + its coupon made.
    expect(result.coupons.created.map((c) => c.storeName)).toEqual(["New Store"]);
    expect(result.coupons.errors).toHaveLength(1);
    expect(result.coupons.errors[0].storeName).toBe("Old Store");
    expect(result.coupons.errors[0].message).toMatch(/Store bị lỗi/);
  });
});
