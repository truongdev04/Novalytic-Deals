export interface BlogSection {
  id: string;
  heading: string;
  bodyHtml: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

const TOP_LEVEL_BLOCK_TAG = /^(?:p|h[1-4]|ul|ol|blockquote|table|hr)$/;

// Splits Tiptap-produced HTML into its top-level block elements, matching each
// opening tag to its correct closing tag by tracking nesting depth per tag
// name — needed because e.g. a bullet list can nest another <ul> inside one
// of its <li> items.
function splitTopLevelBlocks(html: string): string[] {
  const blocks: string[] = [];
  const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let match: RegExpExecArray | null;
  let blockStart = -1;
  let blockTag = "";
  let depth = 0;

  while ((match = tagRegex.exec(html))) {
    const [full, slash, tagName] = match;
    const closing = slash === "/";
    const selfClosing = full.endsWith("/>");
    const lower = tagName.toLowerCase();

    if (depth === 0) {
      if (closing || !TOP_LEVEL_BLOCK_TAG.test(lower)) continue;
      if (selfClosing || lower === "hr") {
        blocks.push(full);
        continue;
      }
      blockStart = match.index;
      blockTag = lower;
      depth = 1;
      continue;
    }

    if (lower !== blockTag) continue;
    if (closing) {
      depth -= 1;
      if (depth === 0) blocks.push(html.slice(blockStart, match.index + full.length));
    } else if (!selfClosing) {
      depth += 1;
    }
  }

  return blocks;
}

// Parses a lightweight "## Heading" convention: whichever block's text starts
// with "## " becomes a new Table-of-Contents section — independent of any
// real heading style applied via the rich-text toolbar. Every other block
// belongs to the current section's body. Two input shapes are supported:
// legacy plain text saved before Body used a rich-text editor (blocks
// separated by a blank line) and Tiptap HTML (blocks are its own
// <p>/<h*>/<ul>/... tags). Swap for a real MDX/rehype pipeline once posts
// come from a CMS.
export function parseBlogSections(body: string): BlogSection[] {
  const isHtml = /<[a-z][\s\S]*>/i.test(body);
  const blocks = isHtml
    ? splitTopLevelBlocks(body)
    : body.split("\n\n").map((block) => `<p>${escapeHtml(block)}</p>`);

  const sections: BlogSection[] = [];

  for (const block of blocks) {
    const text = stripTags(block);
    if (text.startsWith("## ")) {
      const heading = text.slice(3).trim();
      sections.push({ id: slugify(heading), heading, bodyHtml: "" });
    } else if (sections.length > 0) {
      sections[sections.length - 1].bodyHtml += block;
    }
  }

  return sections;
}
