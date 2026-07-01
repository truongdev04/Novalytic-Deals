export interface BlogSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Parses a lightweight "## Heading" markdown convention used by the mock blog
// content. Swap for a real MDX/rehype pipeline once posts come from the CMS.
export function parseBlogSections(body: string): BlogSection[] {
  const blocks = body.split("\n\n");
  const sections: BlogSection[] = [];

  for (const block of blocks) {
    if (block.startsWith("## ")) {
      sections.push({ id: slugify(block.slice(3).trim()), heading: block.slice(3).trim(), paragraphs: [] });
    } else if (sections.length > 0) {
      sections[sections.length - 1].paragraphs.push(block);
    }
  }

  return sections;
}
