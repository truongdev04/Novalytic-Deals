import { hashSeed } from "@/lib/utils";
import type { StoreFaqTemplateSet } from "@/types";

// Pure string substitution shared by the server-side auto-fill resolvers
// (lib/content/defaults.ts) and admin form placeholder previews — kept
// dependency-free so it's safe to import from client components.
export function applyTemplate(template: string | undefined, name: string): string {
  if (!template || !name) return "";
  return template.replaceAll("{name}", name);
}

// Replaces multiple {key} placeholders at once from a vars map — used for
// the Store SEO title/description fixed structure ({name}/{discount}/
// {month}/{year}), as opposed to applyTemplate's single {name} substitution
// used everywhere else.
export function applyTemplateVars(
  template: string | undefined,
  vars: Record<string, string>
): string {
  if (!template) return "";
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    template
  );
}

// Current UTC month name in English, e.g. "July" — used for the {month}
// placeholder. Pure/client-safe (no server dependency).
export function getUtcMonthName(date: Date): string {
  return date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

// Current UTC period key, e.g. "2026-07" — the unit the SEO discount
// snapshot freezes on (lib/content/storeSeoSnapshot.ts).
export function getUtcPeriodKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Splits a template into candidate lines (one variation per line) — for
// templates where each candidate is a single short line (e.g. Coupon —
// Description), as opposed to splitTemplateBlocks below.
export function splitTemplateLines(template: string | undefined): string[] {
  if (!template) return [];
  return template
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Picks one candidate line at random (see splitTemplateLines).
export function pickRandomLine(template: string | undefined): string | undefined {
  const lines = splitTemplateLines(template);
  if (lines.length === 0) return undefined;
  return lines[Math.floor(Math.random() * lines.length)];
}

// Splits a template into candidate variations — for templates where a single
// candidate can itself be multiple lines (e.g. a 2-3 sentence description
// with its own line breaks), candidates are separated by a BLANK line
// instead of every line break, so a multi-line candidate isn't chopped into
// several fake ones.
export function splitTemplateBlocks(template: string | undefined): string[] {
  if (!template) return [];
  return template
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

// Picks one candidate block at random (see splitTemplateBlocks).
export function pickRandomBlock(template: string | undefined): string | undefined {
  const blocks = splitTemplateBlocks(template);
  if (blocks.length === 0) return undefined;
  return blocks[Math.floor(Math.random() * blocks.length)];
}

// Deterministically assigns storeId to exactly one set via consistent
// hashing (hash-ring lookup): the set whose hash is the smallest value
// >= hash(storeId), wrapping to the globally smallest-hash set if none
// qualify. Pure function of (storeId, sets) — nothing persisted, so
// removing a set only remaps the stores whose nearest ring neighbor WAS
// that set; every other store's assignment is unaffected. Sets with no
// items are treated as not existing, so a store never lands on an empty
// set while another set still has content.
export function pickFaqSet(
  storeId: string,
  sets: StoreFaqTemplateSet[]
): StoreFaqTemplateSet | undefined {
  const eligible = sets.filter((set) => set.items.length > 0);
  if (eligible.length === 0) return undefined;
  const target = hashSeed(storeId);
  const ring = eligible
    .map((set) => ({ set, hash: hashSeed(set.setId) }))
    .sort((a, b) => a.hash - b.hash || a.set.setId.localeCompare(b.set.setId));
  const match = ring.find((entry) => entry.hash >= target);
  return (match ?? ring[0]).set;
}

// Collapses a block's internal line breaks into single spaces — for
// plain-text destinations (SEO title/description meta tags, form
// placeholders) where a literal newline wouldn't render as one.
export function flattenBlock(block: string | undefined): string {
  if (!block) return "";
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

// Converts a block's internal line breaks into <br> tags — for destinations
// that render as HTML (e.g. Store.description via RichHtml), so the line
// breaks the admin typed actually show up instead of collapsing into one
// run-on line the way raw "\n" would in HTML.
export function blockToHtml(block: string | undefined): string {
  if (!block) return "";
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("<br>");
}
