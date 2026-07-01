import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonld";

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const allItems: BreadcrumbItem[] = [{ name: "Home", path: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-600">
      <JsonLd data={breadcrumbJsonLd(allItems)} />
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        return (
          <span key={item.path} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-400" />}
            {isLast ? (
              <span className="font-medium text-brand-900" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="flex items-center gap-1 hover:text-brand-700">
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
