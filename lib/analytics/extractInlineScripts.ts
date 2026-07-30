export interface ExtractedScript {
  src?: string;
  code?: string;
}

// Pulls the top-level <script> tags out of an admin-pasted snippet (e.g. the
// literal install code copied from Google Analytics/GTM) so each can be fed
// into next/script's beforeInteractive strategy, which only accepts a `src`
// or plain JS children — not a raw HTML block. Non-script content (meta,
// noscript, etc.) is intentionally dropped; that belongs in the Body/Footer
// fields instead, which accept raw HTML.
export function extractInlineScripts(raw: string): ExtractedScript[] {
  const matches = [...raw.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (matches.length === 0) {
    const trimmed = raw.trim();
    return trimmed ? [{ code: trimmed }] : [];
  }
  return matches.map(([, attrs, content]) => {
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    return srcMatch ? { src: srcMatch[1] } : { code: content.trim() };
  });
}
