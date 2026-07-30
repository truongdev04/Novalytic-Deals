import { describe, expect, it, vi } from "vitest";

// `unstable_cache` lưu kết quả bằng JSON. JSON.stringify XOÁ HẲN key có giá
// trị undefined, nên một object vừa tính (cache miss) serialize khác với chính
// nó khi đọc lại từ cache (cache hit) — React Flight in ra `"$undefined"` ở
// bản đầu và không in gì ở bản sau. Payload đổi mỗi lần regenerate làm hỏng
// dedup ISR của Vercel, tức mọi lần revalidate đều bị tính tiền.
//
// Bất biến: giá trị trả về từ repo phải BẰNG CHÍNH NÓ sau khi round-trip JSON.
// Dùng toStrictEqual (không phải toEqual) vì toEqual bỏ qua key undefined —
// đúng cái đang cần bắt.
function expectJsonStable(value: unknown) {
  expect(JSON.parse(JSON.stringify(value))).toStrictEqual(value);
}

vi.mock("@/lib/server/cache/purgeTag", () => ({ purgeTag: vi.fn() }));
// Bỏ lớp cache đi để test đúng giá trị mapper trả ra.
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

const findMany = {
  store: vi.fn(),
  coupon: vi.fn(),
  deal: vi.fn(),
  category: vi.fn(),
  event: vi.fn(),
  eventCoupon: vi.fn(),
  blogPost: vi.fn(),
  blogTopic: vi.fn(),
};

vi.mock("@/lib/server/db", () => ({
  prisma: {
    store: { findMany: (...a: unknown[]) => findMany.store(...a) },
    // getAllCouponsCached chạy ensureCouponsExpired trước khi đọc — không có
    // coupon nào quá hạn trong test nên count trả 0 và updateMany là no-op.
    coupon: {
      findMany: (...a: unknown[]) => findMany.coupon(...a),
      count: async () => 0,
      updateMany: async () => ({ count: 0 }),
    },
    deal: { findMany: (...a: unknown[]) => findMany.deal(...a) },
    category: { findMany: (...a: unknown[]) => findMany.category(...a) },
    event: { findMany: (...a: unknown[]) => findMany.event(...a) },
    eventCoupon: { findMany: (...a: unknown[]) => findMany.eventCoupon(...a) },
    blogPost: { findMany: (...a: unknown[]) => findMany.blogPost(...a) },
    blogTopic: { findMany: (...a: unknown[]) => findMany.blogTopic(...a) },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

const { getStores } = await import("./stores");
const { getAllCoupons } = await import("./coupons");
const { getDeals } = await import("./deals");
const { getCategories } = await import("./categories");
const { getEvents } = await import("./events");
const { getAllBlogPosts } = await import("./blog");
const { getBlogTopics } = await import("./blogTopics");

const NOW = new Date("2026-07-01T00:00:00.000Z");

// Mọi cột nullable đều để null — đó chính là nhánh sinh ra `?? undefined`.
const storeRow = {
  id: "s1",
  slug: "store-1",
  name: "Store 1",
  logoUrl: "logo.png",
  bannerUrl: null,
  website: "https://example.com",
  description: "desc",
  aboutStore: "about",
  howToApply: null,
  rating: 5,
  ratingCount: 0,
  categoryIds: ["c1"],
  eventId: null,
  region: "US",
  affiliateNetwork: "",
  isFeatured: false,
  isPin: false,
  isActive: true,
  currentMonthClicks: 0,
  lastMonthClicks: 0,
  seo: { title: "", description: "" },
  faq: [],
  seoDiscountSnapshot: null,
  seoDiscountSnapshotPeriod: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const couponRow = {
  id: "cp1",
  slug: "coupon-1",
  storeId: "s1",
  title: "Coupon 1",
  description: "desc",
  type: "DEAL",
  code: null,
  discountType: "PERCENT",
  discountValue: 10,
  currency: "USD",
  affiliateUrl: "https://example.com",
  exclusive: false,
  verified: true,
  verifiedAt: null,
  terms: "",
  startsAt: NOW,
  expiresAt: null,
  usageCount: 0,
  upvotes: 0,
  downvotes: 0,
  isFeatured: false,
  isTrending: false,
  isActive: true,
  currentHourClicks: 0,
  lastHourClicks: 0,
  createdAt: NOW,
  updatedAt: NOW,
};

const dealRow = {
  id: "d1",
  slug: "deal-1",
  storeId: "s1",
  name: "Deal 1",
  type: "DEAL",
  code: null,
  eventId: null,
  categoryId: null,
  originalPrice: null,
  price: 10,
  offer: null,
  url: "https://example.com",
  imageUrl: "img.png",
  description: null,
  isFeatured: false,
  isActive: true,
  currentHourClicks: 0,
  lastHourClicks: 0,
  createdAt: NOW,
  updatedAt: NOW,
};

const categoryRow = {
  id: "c1",
  slug: "cat-1",
  name: "Cat 1",
  description: "desc",
  iconName: null,
  iconImageUrl: null,
  parentId: null,
  isFeatured: false,
  seo: { title: "", description: "" },
  faq: [],
  createdAt: NOW,
};

const eventRow = {
  id: "e1",
  slug: "event-1",
  name: "Event 1",
  iconName: null,
  iconImageUrl: null,
  description: "desc",
  bannerUrl: null,
  startsAt: null,
  endsAt: null,
  createdAt: NOW,
};

const blogRow = {
  id: "b1",
  slug: "post-1",
  title: "Post 1",
  excerpt: "excerpt",
  coverImage: "cover.png",
  authorName: "Author",
  authorAvatarUrl: null,
  categoryId: null,
  topicId: null,
  body: "body",
  readingMinutes: 3,
  publishedAt: NOW,
  seo: { title: "", description: "" },
  isFeatured: false,
  isFirst: false,
  isActive: true,
  createdAt: NOW,
};

const topicRow = {
  id: "t1",
  slug: "topic-1",
  name: "Topic 1",
  description: null,
  createdAt: NOW,
};

describe("repo trả về giá trị ổn định qua JSON round-trip", () => {
  it("getStores", async () => {
    findMany.store.mockResolvedValue([storeRow]);
    expectJsonStable(await getStores());
  });

  it("getAllCoupons", async () => {
    findMany.coupon.mockResolvedValue([couponRow]);
    expectJsonStable(await getAllCoupons());
  });

  it("getDeals", async () => {
    findMany.deal.mockResolvedValue([dealRow]);
    expectJsonStable(await getDeals());
  });

  it("getCategories", async () => {
    findMany.category.mockResolvedValue([categoryRow]);
    expectJsonStable(await getCategories());
  });

  it("getEvents", async () => {
    findMany.event.mockResolvedValue([eventRow]);
    findMany.store.mockResolvedValue([]);
    findMany.eventCoupon.mockResolvedValue([]);
    expectJsonStable(await getEvents());
  });

  it("getAllBlogPosts", async () => {
    findMany.blogPost.mockResolvedValue([blogRow]);
    expectJsonStable(await getAllBlogPosts());
  });

  it("getBlogTopics", async () => {
    findMany.blogTopic.mockResolvedValue([topicRow]);
    expectJsonStable(await getBlogTopics());
  });
});
