import type { BlogSection } from "@/lib/blog";

export function TableOfContents({ sections }: { sections: BlogSection[] }) {
  // The leading section (content before the first "## ") has no heading and no
  // anchor, so it never appears in the contents list.
  const linked = sections.filter((section) => section.heading);
  if (linked.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="rounded-lg border border-muted-200 bg-surface-0 p-5">
      <h2 className="font-heading text-sm font-semibold text-brand-950">On this page</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {linked.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="text-muted-600 hover:text-brand-700">
              {section.heading}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
