// Shared style logic for images inserted via the RichTextEditor, used both by
// CustomImage's Tiptap attribute renderHTML (needs a CSS string) and by
// ImageInsertModal's live preview (needs a React inline-style object) — kept
// in one place so the two can never drift out of sync.

export const IMAGE_BORDER_COLOR = "#cbd5d0"; // ~muted-300, matches other borders in .rich-text-content

export type ImagePosition = "" | "left" | "center" | "right";

export function borderStyleProps(borderWidth: number | string | null | undefined): Record<string, string> {
  if (!borderWidth) return {};
  return { border: `${borderWidth}px solid ${IMAGE_BORDER_COLOR}` };
}

// Only the side facing the wrapped text gets a margin for left/right floats
// (the far edge already touches the container edge). Center never receives
// hspace — a fixed-px margin on both sides would break the `margin: auto`
// centering, so callers must null out hspace whenever position is "center".
export function hspaceStyleProps(
  hspace: number | string | null | undefined,
  position: string | null | undefined
): Record<string, string> {
  if (!hspace || position === "center") return {};
  if (position === "left") return { marginRight: `${hspace}px` };
  if (position === "right") return { marginLeft: `${hspace}px` };
  return { marginLeft: `${hspace}px`, marginRight: `${hspace}px` };
}

export function vspaceStyleProps(vspace: number | string | null | undefined): Record<string, string> {
  if (!vspace) return {};
  return { marginTop: `${vspace}px`, marginBottom: `${vspace}px` };
}

function toKebabCase(prop: string): string {
  return prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function styleObjectToCss(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([prop, value]) => `${toKebabCase(prop)}: ${value}`)
    .join("; ");
}
