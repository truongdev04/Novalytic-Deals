import Link from "next/link";
import { Tag } from "lucide-react";
import { getEvents, getStores, getCategories } from "@/lib/data";
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
  const [events, stores, categories] = await Promise.all([
    getEvents(),
    getStores(),
    getCategories(),
  ]);
  const suggestions = [
    ...stores.map((s) => s.name),
    ...categories.map((c) => c.name),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-muted-200 bg-surface-0/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Tag className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-semibold text-brand-950">
            NovalyticDeals
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
      </Container>
    </header>
  );
}
