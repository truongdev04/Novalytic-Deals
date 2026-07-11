import Link from "next/link";
import { Tag } from "lucide-react";
import { getEvents, getStores, getCategories, getGeneralSettings } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { EventsDropdown } from "@/components/layout/EventsDropdown";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { name: "Stores", href: "/stores" },
  { name: "Categories", href: "/categories" },
  { name: "Deals", href: "/deals" },
  { name: "Blog", href: "/blog" },
];

export async function Header() {
  const [events, stores, categories, settings] = await Promise.all([
    getEvents(),
    getStores(),
    getCategories(),
    getGeneralSettings(),
  ]);
  const suggestions = [
    ...stores.map((s) => s.name),
    ...categories.map((c) => c.name),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-muted-200 bg-surface-0/95 backdrop-blur">
      <Container>
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-configured logo can be any external URL, outside next/image's remotePatterns allowlist
              <img
                src={settings.logoUrl}
                alt={settings.title}
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Tag className="h-5 w-5" />
              </span>
            )}
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-lg font-semibold text-brand-950">
                {settings.title || "NovalyticDeals"}
              </span>
              {settings.slogan && (
                <span className="text-xs font-normal text-muted-500">{settings.slogan}</span>
              )}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-700 hover:bg-surface-100 hover:text-brand-800"
            >
              Home
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-700 hover:bg-surface-100 hover:text-brand-800"
              >
                {link.name}
              </Link>
            ))}
            <EventsDropdown events={events} />
          </nav>

          <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
            <SearchAutocomplete
              id="header-search-suggestions"
              suggestions={suggestions}
              className="max-w-xs"
            />
            <Button asChild size="md" className="shrink-0">
              <Link href="/deals">Browse Deals</Link>
            </Button>
          </div>

          <MobileNav events={events} />
        </div>

        {settings.topDescription && (
          <p className="hidden border-t border-muted-100 py-2 text-xs text-muted-500 sm:block">
            {settings.topDescription}
          </p>
        )}
      </Container>
    </header>
  );
}
