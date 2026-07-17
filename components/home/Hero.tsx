import Image from "next/image";
import { getGeneralSettings } from "@/lib/data";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

export async function Hero() {
  const settings = await getGeneralSettings();

  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/hero/home-hero.svg"
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h1 className="max-w-3xl font-heading text-4xl font-bold text-white sm:text-6xl">
          {settings.slogan || "Verified coupon codes & exclusive deals"}
        </h1>
        <p className="mt-4 max-w-xl text-brand-100">
          {settings.topDescription ||
            "Save more on your favorite brands with thousands of tested and verified discount codes."}
        </p>
        <div className="mt-8 w-full sm:w-3/5">
          <SearchAutocomplete id="hero-search" inputClassName="h-[58px] rounded-2xl text-base" />
        </div>
      </div>
    </section>
  );
}
