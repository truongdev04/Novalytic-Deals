import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getStores, getCoupons, getCategories, groupStoresByLetter } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { SearchBox } from "@/components/search/SearchBox";
import { AlphabetNav } from "@/components/store/AlphabetNav";
import { VerifiedStoresSection } from "@/components/store/VerifiedStoresSection";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Store Directory — Verified Coupon Codes & Deals",
    description:
      "Browse verified coupon codes and deals from your favorite retailers, organized from A to Z.",
    path: "/stores",
  });
}

const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const allStores = await getStores();
  const letterGroups = groupStoresByLetter(allStores);
  const availableLetters = new Set(letterGroups.keys());

  const allCoupons = await getCoupons();
  const verifiedCouponCountByStore = new Map<string, number>();
  for (const coupon of allCoupons) {
    if (!coupon.verified) continue;
    verifiedCouponCountByStore.set(
      coupon.storeId,
      (verifiedCouponCountByStore.get(coupon.storeId) ?? 0) + 1
    );
  }

  const categories = await getCategories();

  const featuredStores = allStores.filter((store) => store.isFeatured);
  const categoriesWithFeaturedStore = categories.filter((category) =>
    featuredStores.some((store) => store.categoryIds.includes(category.id))
  );

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero/home-hero.svg"
            alt=""
            fill
            priority
            className="object-cover"
          />
        </div>
        <Container className="flex flex-col items-center py-14 text-center sm:py-20">
          <h1 className="max-w-3xl font-heading text-4xl font-bold text-white sm:text-6xl">
            Every store, one place to save.
          </h1>
          <p className="mt-4 max-w-xl text-brand-100">
            Browse verified coupon codes and deals from your favorite retailers, organized from A
            to Z.
          </p>

          <div className="mt-8 w-full sm:w-3/5">
            <SearchBox
              defaultValue={q}
              placeholder="Search stores..."
              action="/stores"
              inputClassName="h-[58px] rounded-2xl text-base"
            />
          </div>

          <div className="mt-8">
            <AlphabetNav
              availableLetters={availableLetters}
              variant="dark"
              className="justify-center"
            />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <Breadcrumb items={[{ name: "Stores", path: "/stores" }]} />

        <div className="mt-10">
          <SectionHeader title="Find stores by category" align="left" />
          <CategoryGrid categories={categories} />
        </div>

        <div className="mt-14">
          <VerifiedStoresSection
            featuredStores={featuredStores}
            categories={categoriesWithFeaturedStore}
            verifiedCouponCountByStore={Object.fromEntries(verifiedCouponCountByStore)}
          />
        </div>

        <div className="mt-14">
          <SectionHeader
            title="Complete store index"
            subtitle="Every indexed store, organized alphabetically."
            align="left"
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {LETTERS.map((letter) => {
              const count = letterGroups.get(letter)?.length ?? 0;
              const href = letter === "#" ? "/stores/0-9" : `/stores/${letter}`;

              if (count === 0) {
                return (
                  <div
                    key={letter}
                    className="rounded-lg border border-muted-200 p-4 text-center opacity-50"
                  >
                    <p className="font-heading text-xl font-bold text-muted-400">
                      {letter === "#" ? "0-9" : letter}
                    </p>
                    <p className="mt-1 text-xs text-muted-400">0 stores</p>
                  </div>
                );
              }

              return (
                <Link
                  key={letter}
                  href={href}
                  className="rounded-lg border border-muted-200 bg-surface-0 p-4 text-center shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <p className="font-heading text-xl font-bold text-brand-950">
                    {letter === "#" ? "0-9" : letter}
                  </p>
                  <p className="mt-1 text-xs text-muted-500">
                    {count} {count === 1 ? "store" : "stores"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
