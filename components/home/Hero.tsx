import { getContentConfigSettings } from "@/lib/data";
import { PageHero } from "@/components/layout/PageHero";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

export async function Hero() {
  const { pageBanners } = await getContentConfigSettings();
  const banner = pageBanners.home;

  return (
    <PageHero imageSrc={banner.imageUrl || undefined}>
      <h1 className="max-w-3xl font-heading text-3xl font-bold text-white sm:text-4xl md:text-5xl">
        {banner.title || "Verified coupon codes & exclusive deals"}
      </h1>
      <p className="mt-4 max-w-xl text-brand-100">
        {banner.description ||
          "Save more on your favorite brands with thousands of tested and verified discount codes."}
      </p>
      <div className="mt-8 w-full max-w-xl">
        <SearchAutocomplete id="hero-search" inputClassName="h-14.5 rounded-2xl text-base" />
      </div>
    </PageHero>
  );
}
