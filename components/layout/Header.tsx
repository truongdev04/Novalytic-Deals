import { Link } from "next-view-transitions";
import { Tag } from "lucide-react";
import { getEvents, getGeneralSettings } from "@/lib/data";
import { Container } from "@/components/layout/Container";
import { EventsDropdown } from "@/components/layout/EventsDropdown";
import { MobileNav } from "@/components/layout/MobileNav";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { Button } from "@/components/ui/Button";

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
          <div className="flex min-w-0 items-center gap-4 xl:gap-6">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-configured logo can be any external URL, outside next/image's remotePatterns allowlist
                <img
                  src={settings.logoUrl}
                  alt={settings.title}
                  draggable={false}
                  className="pointer-events-none max-h-16 w-auto shrink-0 object-contain"
                />
              ) : (
                <>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Tag className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 truncate font-heading text-lg font-semibold text-brand-950 sm:text-2xl lg:text-3xl">
                    {settings.title || "NovalyticDeals"}
                  </span>
                </>
              )}
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
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <HeaderSearch />
            <Button asChild size="sm" className="hidden rounded-lg lg:inline-flex">
              <Link href="/submit">Submit Coupon</Link>
            </Button>
            <MobileNav events={events} />
          </div>
        </div>
      </Container>
    </header>
  );
}
