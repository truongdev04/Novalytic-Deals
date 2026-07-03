---
name: rich-text-toolbar
description: Add the Word-like TipTap rich-text editor (headings, font size, colors, tables, image insert with Cloudinary webp upload, centered link dialog) used for Store Description/About Store/How To Apply to a new form field.
---

Use when a form field needs the same rich-text power as Store's
Description/About Store/How To Apply — not a plain textarea.

## Reuse these (don't rebuild)

- `components/admin/RichTextEditor.tsx` — the editor + toolbar.
  Props: `value` (HTML), `onChange(html)`, `placeholder`,
  `minHeightClassName`. Toolbar: heading `<select>` (Normal/H1-H4),
  font-size `<select>` (custom `FontSize` Extension inside this file —
  no official Tiptap package for it, adds a `fontSize` attr to the
  `textStyle` mark like `extension-color` does for text color),
  bold/italic/underline/strike, highlight + highlight-color, text-color,
  sub/superscript, clear formatting, lists/quote/hr, align, link, insert
  image, table insert/add-row/add-col/delete, undo/redo.
- `components/admin/ImageInsertModal.tsx` — "Insert image" button opens
  this. Requires Alt Text before Insert enables; Width/Height are
  aspect-locked. Doesn't upload yet — registers the `File` via
  `registerPendingImage()` and inserts a local `blob:` `<img>` tagged
  `data-pending-upload="true"`.
- `lib/richTextImageUpload.ts` — `resolveRichTextImages(html)` uploads
  every pending image to `/api/admin/upload`
  (`provider=cloudinary&format=webp`) and swaps in the real URL. **Must
  be called in the form's `onSubmit`** for every rich-text field before
  sending to the API — see `StoreForm.tsx`'s `onSubmit`.
- `components/admin/LinkModal.tsx` — centered `Modal` for link
  insert/edit/remove (not `window.prompt`).
- `.rich-text-content` CSS in `app/globals.css` — restores list/quote/
  heading/hr/mark/table/img styling Tailwind preflight strips.
- Rendering saved HTML publicly: `components/ui/RichHtml.tsx`
  (sanitizes + `dangerouslySetInnerHTML`, full render) or `stripHtml()`
  from `lib/utils.ts` (plain-text excerpt for cards/blurbs).

## Steps for a new field

1. Zod: `z.string().min(1, "...")`.
2. Form: `Controller` + `<RichTextEditor value={field.value} onChange={field.onChange} .../>`.
3. In `onSubmit`, run the value through `resolveRichTextImages()` first.
4. Display it via `<RichHtml html={...} />` or `stripHtml(...)`, never raw `{value}`.

## Verify

Apply each toolbar control and check the resulting HTML tag/attribute;
insert an image, submit, confirm the saved `<img src>` is a real
`res.cloudinary.com/...webp` URL with no `data-pending-upload` left.
`npm run typecheck && npm run lint` clean.
