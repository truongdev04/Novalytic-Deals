---
name: rich-text-toolbar
description: Add the Word-like TipTap rich-text editor (headings, font size, colors, tables, image insert/edit with Cloudinary webp upload or external URL, centered link dialog) used for Store Description/About Store/How To Apply to a new form field.
---

Use when a form field needs the same rich-text power as Store's
Description/About Store/How To Apply — not a plain textarea.

## Reuse these (don't rebuild)

- `components/admin/RichTextEditor.tsx` — the editor + toolbar.
  Props: `value` (HTML), `onChange(html)`, `placeholder`,
  `minHeightClassName`, `maxHeightClassName` (default `max-h-96` —
  content beyond this scrolls inside the editor via `overflow-y-auto`
  instead of pushing the whole page taller). Toolbar: heading `<select>`
  (Normal/H1-H4), font-size `<select>` (custom `FontSize` Extension
  inside this file — no official Tiptap package for it, adds a
  `fontSize` attr to the `textStyle` mark like `extension-color` does
  for text color), bold/italic/underline/strike, highlight +
  highlight-color, text-color, sub/superscript, clear formatting,
  lists/quote/hr, align, link, insert image, table
  insert/add-row/add-col/delete, undo/redo.
  - Pasting an image directly (Ctrl+V) inserts it without opening the
    dialog. If the clipboard also has a `text/html` fragment (typical
    when copying an image from a webpage, not a raw screenshot), the
    real source `src`/`alt` is used and nothing is uploaded — only a
    plain screenshot/clipboard-only image falls back to a local `blob:`
    pending upload.
  - Double-clicking an already-inserted image reopens the same dialog
    pre-filled for editing (see `ImageInsertModal.tsx` below).
  - A single click selects an image with a visible outline
    (`.rich-text-content img.ProseMirror-selectednode` in
    `app/globals.css`) — this is just visual feedback, not something a
    new field needs to wire up itself.
  - The image node is configured `inline: true` (`CustomImage.configure`
    in this file) so consecutive images sit side by side and wrap like
    text; `.rich-text-content img { display: inline-block }` in
    `globals.css` is required alongside this (Tailwind preflight forces
    `img { display: block }` otherwise, which silently defeats the
    inline config).
- `components/admin/ImageInsertModal.tsx` — "Insert image" button opens
  this (also opened automatically on double-click of an existing image,
  in which case its title becomes "Edit image" and the Insert button
  becomes "Save changes"). Fields: **URL** (a real editable input — type
  or paste an external image link directly, e.g. from Google/Facebook;
  no upload happens for these, no `data-upload-id`/`data-pending-upload`
  attached), **Upload Image** button on its own row (file picker;
  picking a file always wins over a typed URL), **Alt text** (optional —
  defaults to `"Product image"` if left blank, on both insert and edit),
  **Width/Height** (each its own full-width row, aspect-ratio lock
  toggle, auto-fills from the image's natural size the moment it loads
  — including when re-opening an existing image that never had an
  explicit size), **Max width** (toggle — full-bleed
  `width:100%; height:auto`, responsive; toggling off recomputes
  Width/Height from natural size instead of leaving them blank),
  **Border (px)**, **Horizontal spacing (px)**, **Vertical spacing
  (px)**, **Position** (None/Left/Center/Right — float+wrap for
  Left/Right, centered block for Center; Horizontal spacing and
  Position are both disabled/nulled whenever Max width is on, and
  Horizontal spacing is also disabled when Position is Center since a
  fixed margin would fight `margin:auto` centering). A live preview
  panel on the right shows the image inline with sample paragraph text
  so spacing/position/border are visible before inserting.
  - Still uses `registerPendingImage()`/a local `blob:` `<img>` tagged
    `data-pending-upload="true"` for anything picked via **Upload
    Image** — those still don't upload until `resolveRichTextImages()`
    runs in the form's `onSubmit`. URL-inserted images skip this
    entirely (nothing pending, nothing to resolve).
- `lib/richTextImageStyle.ts` — `borderStyleProps`/`hspaceStyleProps`/
  `vspaceStyleProps`/`styleObjectToCss`: shared logic for turning
  Border/Horizontal/Vertical spacing into CSS, used by both
  `CustomImage`'s Tiptap attribute `renderHTML` (needs a CSS string) and
  the modal's live preview (needs a React style object) so the two can
  never drift apart.
- `lib/richTextImageUpload.ts` — `resolveRichTextImages(html)` uploads
  every image still tagged `data-pending-upload="true"` to
  `/api/admin/upload` (`provider=cloudinary&format=webp`) and swaps in
  the real URL; HTML with no pending images (e.g. all images were
  inserted by URL) is returned untouched. **Must be called in the
  form's `onSubmit`** for every rich-text field before sending to the
  API — see `StoreForm.tsx`'s `onSubmit`.
- `components/admin/LinkModal.tsx` — centered `Modal` for link
  insert/edit/remove (not `window.prompt`).
- `.rich-text-content` CSS in `app/globals.css` — restores list/quote/
  heading/hr/mark/table/img styling Tailwind preflight strips, plus the
  image-specific rules above (`display: inline-block`, selected-image
  outline, `[data-position]` float/center rules, `[data-full-width]`
  rule).
- Rendering saved HTML publicly: `components/ui/RichHtml.tsx`
  (sanitizes with `isomorphic-dompurify`'s default config — which keeps
  `style` and `data-*` attributes, so Border/spacing/Position/Max-width
  survive — then `dangerouslySetInnerHTML`, full render) or
  `stripHtml()` from `lib/utils.ts` (plain-text excerpt for
  cards/blurbs).
- Pasting an external image URL (or copying one from a webpage) relies
  on the site-wide CSP allowing `img-src ... https:` (any https host) in
  `next.config.ts` — already set up repo-wide, nothing a new field needs
  to configure.

## Steps for a new field

1. Zod: `z.string().min(1, "...")`.
2. Form: `Controller` + `<RichTextEditor value={field.value} onChange={field.onChange} .../>`. Pass `maxHeightClassName` if the default `max-h-96` doesn't fit the field's context.
3. In `onSubmit`, run the value through `resolveRichTextImages()` first.
4. Display it via `<RichHtml html={...} />` or `stripHtml(...)`, never raw `{value}`.

## Verify

Apply each toolbar control and check the resulting HTML tag/attribute;
insert an image via **Upload Image**, submit, confirm the saved
`<img src>` is a real `res.cloudinary.com/...webp` URL with no
`data-pending-upload` left. Insert a second image via the **URL** field
and confirm it keeps its external `src` unchanged after submit (no
Cloudinary upload). Double-click an inserted image, confirm the dialog
re-opens with its current URL/Alt/Width/Height/Border/spacing/Position
pre-filled, edit and save, confirm it updates in place (no duplicate
node). `npm run typecheck && npm run lint` clean.
