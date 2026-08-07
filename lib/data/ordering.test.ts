import { describe, expect, it, vi } from "vitest";

// Postgres không bảo đảm thứ tự hàng khi query thiếu ORDER BY, hoặc khi khoá
// sắp xếp bị trùng (Array.prototype.sort ổn định nên chỉ giữ nguyên thứ tự
// đầu vào tuỳ ý đó). Thứ tự đổi => HTML/RSC payload đổi => Vercel không dedup
// được và tính Write Unit cho mọi lần revalidate.
//
// Repo phải cho ra kết quả GIỐNG HỆT bất kể Prisma trả hàng theo thứ tự nào,
// nên mỗi test dưới đây chạy 2 lần với đầu vào đảo ngược.

vi.mock("@/lib/server/cache/purgeTag", () => ({ purgeTag: vi.fn() }));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));
vi.mock("./events", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  syncCouponWithStoreEvent: vi.fn(),
}));
vi.mock("./settings", () => ({
  getContentConfigSettings: vi.fn().mockResolvedValue({ templates: {}, pagination: {} }),
}));

const storeFindMany = vi.fn();
const eventFindMany = vi.fn();
const eventCouponFindMany = vi.fn();
const couponGroupBy = vi.fn();

vi.mock("@/lib/server/db", () => ({
  prisma: {
    store: { findMany: (...a: unknown[]) => storeFindMany(...a) },
    event: { findMany: (...a: unknown[]) => eventFindMany(...a) },
    eventCoupon: { findMany: (...a: unknown[]) => eventCouponFindMany(...a) },
    coupon: { groupBy: (...a: unknown[]) => couponGroupBy(...a) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const { getEvents } = await import("./events");
const { getFeaturedStores } = await import("./stores");
const { getVerifiedCouponCountByStoreIds } = await import("./coupons");
const { getCategories } = await import("./categories");

const NOW = new Date("2026-07-01T00:00:00.000Z");

function eventRow(id: string) {
  return {
    id,
    slug: `event-${id}`,
    name: `Event ${id}`,
    iconName: null,
    iconImageUrl: null,
    description: "",
    bannerUrl: null,
    // Tất cả cùng startsAt = null: cùng rơi về sentinel "9999-12-31" nên
    // sort theo startsAt không phân biệt được -> cần tiebreak.
    startsAt: null,
    endsAt: null,
    createdAt: NOW,
  };
}

function storeRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    slug: `store-${id}`,
    name: `Store ${id}`,
    logoUrl: "",
    bannerUrl: null,
    website: "",
    description: "",
    aboutStore: "",
    howToApply: null,
    rating: 0,
    ratingCount: 0,
    categoryIds: [],
    eventId: null,
    region: "US",
    affiliateNetwork: "",
    isFeatured: true,
    isPin: true,
    isActive: true,
    currentMonthClicks: 0,
    lastMonthClicks: 0,
    seo: { title: "", description: "" },
    faq: [],
    seoDiscountSnapshot: null,
    seoDiscountSnapshotPeriod: null,
    createdAt: NOW,
    // Cùng updatedAt: sort pinned theo updatedAt desc không phân biệt được.
    updatedAt: NOW,
    ...overrides,
  };
}

describe("thứ tự tất định bất kể Prisma trả hàng theo thứ tự nào", () => {
  it("getEvents: các event cùng startsAt vẫn ra cùng thứ tự", async () => {
    const rows = [eventRow("c"), eventRow("a"), eventRow("b")];
    eventCouponFindMany.mockResolvedValue([]);
    storeFindMany.mockResolvedValue([]);

    eventFindMany.mockResolvedValue(rows);
    const first = await getEvents();
    eventFindMany.mockResolvedValue([...rows].reverse());
    const second = await getEvents();

    expect(second).toStrictEqual(first);
  });

  it("getFeaturedStores: store pinned cùng updatedAt vẫn ra cùng thứ tự", async () => {
    const rows = [storeRow("c"), storeRow("a"), storeRow("b")];

    storeFindMany.mockResolvedValue(rows);
    const first = await getFeaturedStores(8);
    storeFindMany.mockResolvedValue([...rows].reverse());
    const second = await getFeaturedStores(8);

    expect(second).toStrictEqual(first);
  });

});

// Với các hàm mà thứ tự do SQL quyết định (không có bước sort trong JS), test
// đơn vị với Prisma mock không mô phỏng được hành vi DB — chỉ khẳng định được
// query gửi đi có khoá sắp xếp toàn phần.
describe("query dùng khoá sắp xếp toàn phần", () => {
  it("getVerifiedCouponCountByStoreIds: groupBy có orderBy", async () => {
    couponGroupBy.mockResolvedValue([]);

    await getVerifiedCouponCountByStoreIds(["s1", "s2"]);

    // Kết quả đi thẳng vào Object.fromEntries: thứ tự key = byte trong payload.
    expect(couponGroupBy.mock.calls[0][0]).toHaveProperty("orderBy");
  });

  it("getCategories: orderBy có tiebreak duy nhất ngoài createdAt", async () => {
    const categoryFindMany = vi.fn().mockResolvedValue([]);
    const db = await import("@/lib/server/db");
    (db.prisma as unknown as Record<string, unknown>).category = {
      findMany: categoryFindMany,
    };

    await getCategories();

    const orderBy = categoryFindMany.mock.calls[0][0].orderBy;
    // createdAt có thể trùng (bulk import/seed) nên một mình nó không đủ.
    expect(Array.isArray(orderBy)).toBe(true);
    expect(orderBy.length).toBeGreaterThan(1);
  });
});
