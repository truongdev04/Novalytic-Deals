import type { Metadata } from "next";
import {
  getFeaturedStores,
  getFeaturedCategories,
  getFeaturedBlogPosts,
  getTrendingDeals,
  getCoupons,
  getContentConfigSettings,
} from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyTrustUs } from "@/components/home/WhyTrustUs";
import { StoreCard } from "@/components/store/StoreCard";
import { CategoryCard } from "@/components/category/CategoryCard";
import { DealCard } from "@/components/coupon/DealCard";
import { BlogCard } from "@/components/blog/BlogCard";
import { Newsletter } from "@/components/ui/Newsletter";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSeoSettings } from "@/lib/data";

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
  const config = await getContentConfigSettings();
  const [stores, categories, deals, posts, coupons] = await Promise.all([
    getFeaturedStores(config.pagination.featuredStoresCount),
    getFeaturedCategories(config.pagination.featuredCategoriesCount),
    getTrendingDeals(config.pagination.trendingDealsCount),
    getFeaturedBlogPosts(config.pagination.featuredBlogCount),
    getCoupons(),
  ]);

  const suggestions = [...stores.map((s) => s.name), ...categories.map((c) => c.name)];
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const couponCountByStore = new Map<string, number>();
  const couponCountByCategory = new Map<string, number>();

  for (const coupon of coupons) {
    couponCountByStore.set(coupon.storeId, (couponCountByStore.get(coupon.storeId) ?? 0) + 1);
  }
  for (const category of categories) {
    const count = coupons.filter((c) => {
      const store = storeById.get(c.storeId);
      return store?.categoryIds.includes(category.id);
    }).length;
    couponCountByCategory.set(category.id, count);
  }

  return (
    <>
      <Hero suggestions={suggestions} />

      <div className="space-y-20 py-16">
        <Container>
          <SectionHeader
            title="Popular stores"
            subtitle="Shop from the most trusted retailers and save with exclusive coupon codes"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                couponCount={couponCountByStore.get(store.id) ?? 0}
              />
            ))}
          </div>
        </Container>

        <Container>
          <SectionHeader
            title="Popular categories"
            subtitle="Explore deals by category and find exactly what you need"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                couponCount={couponCountByCategory.get(category.id) ?? 0}
              />
            ))}
          </div>
        </Container>

        <Container>
          <SectionHeader
            title="Today's best deals"
            subtitle="Limited time offers you don't want to miss"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return store ? <DealCard key={coupon.id} coupon={coupon} store={store} /> : null;
            })}
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
