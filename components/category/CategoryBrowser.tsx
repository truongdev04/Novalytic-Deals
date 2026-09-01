"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { DividedSections } from "@/components/layout/DividedSections";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CategoryCard } from "@/components/category/CategoryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, PageBanner } from "@/types";

export function CategoryBrowser({
  categories,
  breadcrumb,
  banner,
}: {
  categories: Category[];
  breadcrumb: ReactNode;
  banner: PageBanner;
}) {
  const [query, setQuery] = useState("");

  const featured = useMemo(
    () => categories.filter((category) => category.isFeatured),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(q) ||
        category.description?.toLowerCase().includes(q)
    );
  }, [categories, query]);

  const searching = query.trim().length > 0;

  return (
    <>
      <PageHero imageSrc={banner.imageUrl || undefined}>
        <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          {banner.title || "All Categories"}
        </h1>
        <p className="mt-4 max-w-xl text-brand-100">
          {banner.description || "Browse every coupon category in one place."}
        </p>
        <div className="relative mt-8 w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="h-14.5 w-full rounded-2xl border border-muted-300 bg-surface-0 pl-10 pr-4 text-base text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>
      </PageHero>

      <Container className="pt-10">{breadcrumb}</Container>

      <DividedSections className="mt-10 pb-16">
        {!searching && featured.length > 0 && (
          <section>
            <Container>
              <SectionHeader
                title="Featured categories"
                subtitle="Hand-picked categories worth a look"
                align="left"
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {featured.map((category) => (
                  <CategoryCard key={category.id} category={category} showCount={false} />
                ))}
              </div>
            </Container>
          </section>
        )}

        <section>
          <Container>
            <SectionHeader
              title="All categories"
              subtitle="Browse the full list"
              align="left"
            />
            {filtered.length === 0 ? (
              <EmptyState
                title="No categories found"
                description="Try a different search term."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {filtered.map((category) => (
                  <CategoryCard key={category.id} category={category} showCount={false} />
                ))}
              </div>
            )}
          </Container>
        </section>
      </DividedSections>
    </>
  );
}
