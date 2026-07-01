import Image from "next/image";
import Link from "next/link";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { Button } from "@/components/ui/Button";

export function Hero({ suggestions }: { suggestions: string[] }) {
  return (
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
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h1 className="max-w-2xl font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          Verified coupon codes & exclusive deals
        </h1>
        <p className="mt-4 max-w-xl text-brand-100">
          Save more on your favorite brands with thousands of tested and verified
          discount codes.
        </p>
        <div className="mt-8 flex w-full max-w-xl flex-col items-center gap-4 sm:flex-row">
          <SearchAutocomplete
            id="hero-search-suggestions"
            suggestions={suggestions}
            placeholder="Search stores, coupons, categories..."
            className="flex-1"
            inputClassName="h-12"
          />
          <Button asChild size="lg" variant="accent" className="w-full sm:w-auto">
            <Link href="/deals">Shop now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
