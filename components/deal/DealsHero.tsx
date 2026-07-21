import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

export function DealsHero({ defaultQuery }: { defaultQuery?: string }) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-brand-700 via-brand-600 to-brand-800">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-accent-400/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
          Today&apos;s Best Deals
        </h1>
        <p className="mt-3 max-w-lg text-brand-100">
          Hand-picked discounts on the products you actually want — updated every hour.
        </p>

        <div className="mt-8 w-full sm:w-4/5">
          <SearchAutocomplete
            id="deals-hero-search"
            defaultValue={defaultQuery}
            placeholder="Search by store..."
            resultMode="deals-filter"
            inputClassName="h-[52px] rounded-2xl text-base"
          />
        </div>
      </div>
    </section>
  );
}
