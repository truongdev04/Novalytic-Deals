import type { Metadata } from "next";
import {
  getStoresByIds,
  getFeaturedStores,
  getFeaturedCategories,
  getFeaturedBlogPosts,
  getFeaturedDeals,
  getTrendingCoupons,
  getExclusiveCoupons,
  getContentConfigSettings,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyTrustUs } from "@/components/home/WhyTrustUs";
import { StoreCarousel } from "@/components/store/StoreCarousel";
import { CategoryCard } from "@/components/category/CategoryCard";
import { DealProductCard } from "@/components/deal/DealProductCard";
import { CouponGridCard } from "@/components/coupon/CouponGridCard";
import { BlogCard } from "@/components/blog/BlogCard";
import { Newsletter } from "@/components/ui/Newsletter";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSeoSettings } from "@/lib/data";
import { ensurePopularStoresAutoRollover } from "@/lib/content/popularStoresRefresh";
import { ensureAutoDealRollover } from "@/lib/content/dealsRefresh";
import { ensureAutoCouponRollover } from "@/lib/content/couponsRefresh";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  return buildMetadata({
    title: seo.homepageTitle || "NovalyticDeals — Verified Coupon Codes & Exclusive Deals",
    description:
      seo.homepageDescription ||
      "Save more with verified coupon codes, exclusive deals, and cashback offers from thousands of trusted brands across the US & Europe.",
    path: "/",
  });
}

export default async function HomePage() {
  // Lazy monthly rollover for "Auto Popular" (see popularStoresRefresh.ts) —
  // must complete before getFeaturedStores() below reads the store list, so
  // it's awaited on its own rather than folded into the Promise.all.
  await ensurePopularStoresAutoRollover();
  // Lazy 8-hour rollover for "Auto Deal" (see lib/content/dealsRefresh.ts) —
  // same reasoning, must complete before getFeaturedDeals() reads the list.
  await ensureAutoDealRollover();
  // Lazy 8-hour rollover for "Auto Coupon" (see lib/content/couponsRefresh.ts) —
  // same reasoning, must complete before getTrendingCoupons() reads the list.
  await ensureAutoCouponRollover();

  const config = await getContentConfigSettings();
  const [stores, categories, deals, trendingCoupons, exclusiveCoupons, posts] =
    await Promise.all([
      getFeaturedStores(config.pagination.featuredStoresCount),
      getFeaturedCategories(config.pagination.featuredCategoriesCount),
      getFeaturedDeals(config.pagination.bestDealsCount),
      getTrendingCoupons(config.pagination.trendingDealsCount),
      getExclusiveCoupons(config.pagination.exclusiveCodesCount),
      getFeaturedBlogPosts(config.pagination.featuredBlogCount),
    ]);

  // Only resolve the handful of stores actually referenced by the cards
  // above, instead of pulling the entire active-store table just to build a
  // lookup map.
  const cardStoreIds = [
    ...new Set([
      ...deals.map((d) => d.storeId),
      ...trendingCoupons.map((c) => c.storeId),
      ...exclusiveCoupons.map((c) => c.storeId),
    ]),
  ];
  const cardStores = await getStoresByIds(cardStoreIds);
  const storeById = new Map(cardStores.map((s) => [s.id, s]));

  return (
    <>
      <Hero />

      <div className="space-y-20 py-16">
        <Container>
          <SectionHeader
            title="Popular stores"
            subtitle="Shop from the most trusted retailers and save with exclusive coupon codes"
          />
          <StoreCarousel stores={stores} />
        </Container>

        <Container>
          <SectionHeader
            title="Today's best deals"
            subtitle="Limited time offers you don't want to miss"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {deals.map((deal) => {
              const store = storeById.get(deal.storeId);
              return store ? <DealProductCard key={deal.id} deal={deal} store={store} /> : null;
            })}
          </div>
        </Container>

        <Container>
          <SectionHeader
            title="Trending coupon"
            subtitle="The codes everyone's using right now"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {trendingCoupons.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return store ? (
                <CouponGridCard key={coupon.id} coupon={coupon} store={store} />
              ) : null;
            })}
          </div>
        </Container>

        <Container>
          <SectionHeader
            title="NovalyticDeals Exclusive Codes"
            subtitle="Verified codes you won't find anywhere else"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {exclusiveCoupons.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return store ? <CouponGridCard key={coupon.id} coupon={coupon} store={store} /> : null;
            })}
          </div>
        </Container>

        <Container>
          <SectionHeader
            title="Popular categories"
            subtitle="Explore deals by category and find exactly what you need"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} showCount={false} />
            ))}
          </div>
        </Container>

        <Container>
          <HowItWorks />
        </Container>

        <Container>
          <WhyTrustUs />
        </Container>

        <Container>
          <SectionHeader title="From our blog" subtitle="Tips, guides, and insights to help you save more" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </Container>
      </div>

      <section className="bg-brand-700">
        <Container className="flex flex-col items-center gap-6 py-14 text-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
              Get the best deals delivered to your inbox
            </h2>
            <p className="mt-2 text-brand-100">
              Subscribe to our newsletter and never miss out on exclusive offers.
            </p>
          </div>
          <div className="w-full max-w-md">
            <Newsletter variant="footer" />
          </div>
        </Container>
      </section>
    </>
  );
}
