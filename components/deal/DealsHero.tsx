import { getContentConfigSettings } from "@/lib/data";
import { PageHero } from "@/components/layout/PageHero";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

export async function DealsHero({ defaultQuery }: { defaultQuery?: string }) {
  const { pageBanners } = await getContentConfigSettings();
  const banner = pageBanners.deals;

  return (
    <PageHero imageSrc={banner.imageUrl || undefined}>
      <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl md:text-5xl">
        {banner.title || "Today's Best Deals"}
      </h1>
      <p className="mt-3 max-w-lg text-brand-100">
        {banner.description ||
          "Hand-picked discounts on the products you actually want — updated every hour."}
      </p>

      <div className="mt-8 w-full max-w-xl">
        <SearchAutocomplete
          id="deals-hero-search"
          defaultValue={defaultQuery}
          placeholder="Search by store..."
          resultMode="deals-filter"
          inputClassName="h-14.5 rounded-2xl text-base"
        />
      </div>
    </PageHero>
  );
}
