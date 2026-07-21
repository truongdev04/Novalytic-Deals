import Link from "next/link";
import { Tag } from "lucide-react";
import { getEvents, getGeneralSettings } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { EventsDropdown } from "@/components/layout/EventsDropdown";
import { MobileNav } from "@/components/layout/MobileNav";
import { HeaderMobileSearch } from "@/components/layout/HeaderMobileSearch";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";

const navLinks = [
  { name: "Stores", href: "/stores" },
  { name: "Deals", href: "/deals" },
  { name: "Blog", href: "/blog" },
];

export async function Header() {
  const [events, settings] = await Promise.all([getEvents(), getGeneralSettings()]);

  return (
    <header className="sticky top-0 z-30 border-b border-muted-200 bg-surface-0/95 backdrop-blur">
      <Container>
        <div className="relative flex min-h-16 items-center justify-between gap-4 py-2">
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
            <span className="font-heading text-3xl font-semibold text-brand-950">
              {settings.title || "NovalyticDeals"}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
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

          <div className="hidden flex-1 items-center justify-end md:flex">
            <SearchAutocomplete id="header-search" className="max-w-xs" />
          </div>

          <div className="flex items-center gap-1">
            <HeaderMobileSearch />
            <MobileNav events={events} />
          </div>
        </div>
      </Container>
    </header>
  );
}
