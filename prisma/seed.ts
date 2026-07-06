import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import storesData from "../data/stores.json";
import couponsData from "../data/coupons.json";
import categoriesData from "../data/categories.json";
import blogData from "../data/blog.json";
import eventsData from "../data/events.json";
import type { Store, Coupon, Category, BlogPost, Event } from "../types";

const prisma = new PrismaClient();

type JsonStore = Store;
type JsonCoupon = Coupon;
type JsonCategory = Category;
// data/blog.json still nests author as { id, name, avatarUrl } even though
// the domain BlogPost type (and blog_posts table) now store it flattened.
type JsonBlogPost = Omit<BlogPost, "authorName" | "authorAvatarUrl"> & {
  author: { id: string; name: string; avatarUrl?: string };
};
type JsonEvent = Event;

async function seedCategories(categories: JsonCategory[]) {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        iconName: c.iconName ?? "",
        iconImageUrl: c.iconImageUrl ?? null,
        parentId: c.parentId ?? null,
        isFeatured: c.isFeatured,
        seo: c.seo as unknown as Prisma.InputJsonValue,
        faq: c.faq as unknown as Prisma.InputJsonValue,
      },
      update: {},
    });
  }
}

async function seedStores(stores: JsonStore[]) {
  for (const s of stores) {
    await prisma.store.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        slug: s.slug,
        name: s.name,
        logoUrl: s.logoUrl,
        bannerUrl: s.bannerUrl ?? null,
        website: s.website,
        description: s.description,
        rating: s.rating,
        ratingCount: s.ratingCount,
        region: s.region,
        affiliateNetwork: s.affiliateNetwork,
        isFeatured: s.isFeatured,
        seo: s.seo as unknown as Prisma.InputJsonValue,
        faq: s.faq as unknown as Prisma.InputJsonValue,
        categoryIds: s.categoryIds,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
      update: {},
    });
  }
}

async function seedCoupons(coupons: JsonCoupon[]) {
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        slug: c.slug,
        storeId: c.storeId,
        title: c.title,
        description: c.description,
        type: c.type,
        code: c.code ?? null,
        discountType: c.discountType,
        discountValue: c.discountValue,
        currency: c.currency,
        affiliateUrl: c.affiliateUrl,
        exclusive: c.exclusive,
        verified: c.verified,
        verifiedAt: c.verifiedAt ? new Date(c.verifiedAt) : null,
        terms: c.terms,
        startsAt: new Date(c.startsAt),
        expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
        usageCount: c.usageCount,
        upvotes: c.upvotes,
        downvotes: c.downvotes,
        isFeatured: c.isFeatured,
        isTrending: c.isTrending,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
      update: {},
    });
  }
}

async function seedBlogPosts(posts: JsonBlogPost[]) {
  for (const p of posts) {
    await prisma.blogPost.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        authorName: p.author.name,
        authorAvatarUrl: p.author.avatarUrl ?? null,
        tags: p.tags,
        categoryId: p.categoryId ?? null,
        body: p.body,
        readingMinutes: p.readingMinutes,
        publishedAt: new Date(p.publishedAt),
        seo: p.seo as unknown as Prisma.InputJsonValue,
        isFeatured: p.isFeatured,
      },
      update: {},
    });
  }
}

async function seedEvents(events: JsonEvent[]) {
  for (const e of events) {
    await prisma.event.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        slug: e.slug,
        name: e.name,
        iconName: e.iconName ?? "",
        description: e.description,
        bannerUrl: e.bannerUrl ?? null,
        startsAt: e.startsAt ? new Date(e.startsAt) : null,
        endsAt: e.endsAt ? new Date(e.endsAt) : null,
        couponId: e.featuredCouponIds,
      },
      update: {},
    });
  }

  // A store belongs to at most one event; if the fixture data lists the same
  // store under more than one event, whichever event is processed last wins.
  for (const e of events) {
    for (const storeId of e.featuredStoreIds) {
      await prisma.store.update({ where: { id: storeId }, data: { eventId: e.id } });
    }
  }
}

async function seedAdminUser() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log("Skipping admin user seed — ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set.");
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, hashedPassword, role: "ADMIN" },
    update: {},
  });
}

async function main() {
  // Categories and stores first (coupons/blog/events reference them).
  await seedCategories(categoriesData as unknown as JsonCategory[]);
  await seedStores(storesData as unknown as JsonStore[]);
  await seedCoupons(couponsData as unknown as JsonCoupon[]);
  await seedBlogPosts(blogData as unknown as JsonBlogPost[]);
  await seedEvents(eventsData as unknown as JsonEvent[]);
  await seedAdminUser();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
