"use client";

import { useRef, useState } from "react";
import { Extension } from "@tiptap/core";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TiptapImage from "@tiptap/extension-image";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  ImagePlus,
  Table2,
  Columns3,
  Rows3,
  Trash2,
  Palette,
  Eraser,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageInsertModal, type EditingImage } from "@/components/admin/ImageInsertModal";
import { LinkModal } from "@/components/admin/LinkModal";
import { registerPendingImage } from "@/lib/richTextImageUpload";
import { borderStyleProps, hspaceStyleProps, vspaceStyleProps, styleObjectToCss } from "@/lib/richTextImageStyle";

const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      height: {
        default: null,
        renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}),
      },
      "data-upload-id": { default: null },
      "data-pending-upload": { default: null },
      "data-full-width": { default: null },
      // Plain literal attribute, same convention as data-full-width above —
      // round-trips automatically via Tiptap's default parseHTML/renderHTML.
      // Only 3 fixed values, so the visual effect (float/center) lives in CSS
      // attribute selectors in globals.css rather than inline style.
      "data-position": { default: null },
      // These three render into `style` (not a standalone attribute) since
      // they're arbitrary px values, not a small fixed enum. Each owns a
      // different CSS property, so mergeAttributes' per-property style merge
      // (confirmed in @tiptap/core source) composes them safely without them
      // needing to know about each other — except hspace, which reads the
      // sibling data-position value (Tiptap passes the full attrs object to
      // every attribute's renderHTML, the same pattern FontSize uses above).
      borderWidth: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = parseInt(element.style.borderWidth || "", 10);
          return Number.isNaN(value) ? null : value;
        },
        renderHTML: (attrs: { borderWidth?: number | string | null }) => {
          const style = styleObjectToCss(borderStyleProps(attrs.borderWidth));
          return style ? { style } : {};
        },
      },
      hspace: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.style.marginRight || element.style.marginLeft;
          const value = parseInt(raw || "", 10);
          return Number.isNaN(value) ? null : value;
        },
        renderHTML: (attrs: { hspace?: number | string | null; "data-position"?: string | null }) => {
          const style = styleObjectToCss(hspaceStyleProps(attrs.hspace, attrs["data-position"]));
          return style ? { style } : {};
        },
      },
      vspace: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.style.marginTop || element.style.marginBottom;
          const value = parseInt(raw || "", 10);
          return Number.isNaN(value) ? null : value;
        },
        renderHTML: (attrs: { vspace?: number | string | null }) => {
          const style = styleObjectToCss(vspaceStyleProps(attrs.vspace));
          return style ? { style } : {};
        },
      },
    };
  },
}).configure({
  // Tiptap's Image node is block-level by default, forcing every image onto
  // its own line. Marking it inline lets consecutive images (inserted or
  // pasted back-to-back with no Enter in between) sit side by side within
  // the same paragraph, wrapping to a new line only once the row runs out
  // of width — matching normal inline flow, no extra CSS needed for this.
  inline: true,
});

// Shared by both handlePaste branches below: creates an image node at
// insertPos and moves the cursor just after it (rather than leaving it as
// the replaceSelectionWith default NodeSelection) so a follow-up paste/
// insert lands beside it inline instead of replacing it.
function insertPastedImageNode(view: EditorView, insertPos: number, attrs: Record<string, unknown>) {
  const node = view.state.schema.nodes.image.create(attrs);
  const tr = view.state.tr.replaceSelectionWith(node);
  const afterPos = Math.min(insertPos + node.nodeSize, tr.doc.content.size);
  tr.setSelection(TextSelection.near(tr.doc.resolve(afterPos)));
  view.dispatch(tr);
  view.focus();
}

// No official Tiptap package ships a font-size mark, so this adds one as a
// small extra attribute on the existing textStyle mark (the same approach
// @tiptap/extension-color uses for text color).
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: { fontSize?: string | null }) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: () => { setMark: (name: string, attrs: object) => { run: () => boolean } } }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => { setMark: (name: string, attrs: object) => { run: () => boolean } } }) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "rounded p-1.5 text-muted-600 hover:bg-surface-100 hover:text-brand-950 disabled:pointer-events-none disabled:opacity-40",
        active && "bg-brand-50 text-brand-700"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

const HEADING_OPTIONS = [
  { value: "paragraph", label: "Normal" },
  { value: "1", label: "Heading 1" },
  { value: "2", label: "Heading 2" },
  { value: "3", label: "Heading 3" },
  { value: "4", label: "Heading 4" },
];

const FONT_SIZE_OPTIONS = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px"];

function Toolbar({
  editor,
  onOpenImageModal,
  onOpenLinkModal,
}: {
  editor: Editor;
  onOpenImageModal: () => void;
  onOpenLinkModal: () => void;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  const currentHeading = ([1, 2, 3, 4] as const).find((level) => editor.isActive("heading", { level }));
  const currentFontSize = (editor.getAttributes("textStyle").fontSize as string | undefined) ?? "";

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-muted-200 bg-surface-50 px-2 py-1.5">
      <select
        aria-label="Text style"
        value={currentHeading ? String(currentHeading) : "paragraph"}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "paragraph") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 })
              .run();
          }
        }}
        className="mr-1 rounded border border-muted-200 bg-surface-0 px-2 py-1 text-xs text-brand-950 focus:outline-none"
      >
        {HEADING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Font size"
        value={currentFontSize}
        onChange={(e) => {
          const value = e.target.value;
          if (!value) {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(value).run();
          }
        }}
        className="mr-1 rounded border border-muted-200 bg-surface-0 px-2 py-1 text-xs text-brand-950 focus:outline-none"
      >
        <option value="">Size</option>
        {FONT_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size.replace("px", "")}
          </option>
        ))}
      </select>
      <span className="mx-1 h-5 w-px bg-muted-200" />
      <ToolbarButton
        label="Bold"
        icon={Bold}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        icon={Italic}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline"
        icon={UnderlineIcon}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Strikethrough"
        icon={Strikethrough}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="Highlight"
        icon={Highlighter}
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />
      <input
        ref={highlightInputRef}
        type="color"
        className="hidden"
        onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
      />
      <ToolbarButton
        label="Highlight color"
        icon={Palette}
        onClick={() => highlightInputRef.current?.click()}
      />
      <input
        ref={colorInputRef}
        type="color"
        className="hidden"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
      />
      <ToolbarButton
        label="Text color"
        icon={Palette}
        active={editor.isActive("textStyle")}
        onClick={() => colorInputRef.current?.click()}
      />
      <ToolbarButton
        label="Subscript"
        icon={SubscriptIcon}
        active={editor.isActive("subscript")}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      />
      <ToolbarButton
        label="Superscript"
        icon={SuperscriptIcon}
        active={editor.isActive("superscript")}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      />
      <ToolbarButton
        label="Clear formatting"
        icon={Eraser}
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      />
      <span className="mx-1 h-5 w-px bg-muted-200" />
      <ToolbarButton
        label="Bullet list"
        icon={List}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered list"
        icon={ListOrdered}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Quote"
        icon={Quote}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Horizontal rule"
        icon={Minus}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <span className="mx-1 h-5 w-px bg-muted-200" />
      <ToolbarButton
        label="Align left"
        icon={AlignLeft}
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      />
      <ToolbarButton
        label="Align center"
        icon={AlignCenter}
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      />
      <ToolbarButton
        label="Align right"
        icon={AlignRight}
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      />
      <ToolbarButton
        label="Justify"
        icon={AlignJustify}
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      />
      <span className="mx-1 h-5 w-px bg-muted-200" />
      <ToolbarButton label="Link" icon={LinkIcon} active={editor.isActive("link")} onClick={onOpenLinkModal} />
      <ToolbarButton label="Insert image" icon={ImagePlus} onClick={onOpenImageModal} />
      <span className="mx-1 h-5 w-px bg-muted-200" />
      <ToolbarButton
        label="Insert table"
        icon={Table2}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <ToolbarButton
        label="Add column"
        icon={Columns3}
        disabled={!editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      />
      <ToolbarButton
        label="Add row"
        icon={Rows3}
        disabled={!editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      />
      <ToolbarButton
        label="Delete table"
        icon={Trash2}
        disabled={!editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      />
      <span className="mx-1 h-5 w-px bg-muted-200" />
      <ToolbarButton
        label="Undo"
        icon={Undo2}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Redo"
        icon={Redo2}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = "min-h-32",
  maxHeightClassName = "max-h-96",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  maxHeightClassName?: string;
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null);
  // Bumped every time the image modal is opened so ImageInsertModal remounts
  // (via the `key` below) and re-derives its initial state from the current
  // editingImage — avoids needing an effect to sync state on open.
  const [imageModalSession, setImageModalSession] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      // Blog's Body field detects `## ` typed at the start of a line as its
      // own Table-of-Contents section marker (see lib/blog.ts), separate
      // from this toolbar's Heading dropdown. StarterKit's default Heading
      // extension has an input rule that eats "## " and converts it into a
      // real heading node before that text can ever be read back — dropping
      // just the input rule here (keeping toggleHeading for the dropdown)
      // lets "##" stay as plain visible text.
      Heading.configure({ levels: [1, 2, 3, 4] }).extend({ addInputRules: () => [] }),
      Underline,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      FontSize,
      CustomImage,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "rich-text-content overflow-y-auto px-4 py-2.5 text-sm text-brand-950 focus:outline-none",
          minHeightClassName,
          maxHeightClassName
        ),
      },
      handlePaste: (view, event) => {
        // Copying an image from a webpage (as opposed to a plain screenshot)
        // puts BOTH the raw re-encoded image bytes AND a semantic text/html
        // fragment (e.g. `<img src="https://original.com/photo.jpg"
        // alt="...">`) on the clipboard. Prefer the HTML fragment when it has
        // a real absolute URL — it carries the ORIGINAL src (no upload
        // needed, matches the "URL images aren't uploaded to Cloudinary"
        // behavior) and the source page's real alt text, instead of always
        // falling back to a local blob with a generic "Product image" alt.
        const html = event.clipboardData?.getData("text/html");
        const imgFromHtml = html
          ? new DOMParser().parseFromString(html, "text/html").querySelector("img[src]")
          : null;
        const htmlSrc = imgFromHtml?.getAttribute("src");

        if (htmlSrc && /^https?:\/\//i.test(htmlSrc)) {
          event.preventDefault();
          const alt = imgFromHtml?.getAttribute("alt")?.trim() || "Product image";
          const insertPos = view.state.selection.from;
          const img = new window.Image();
          const insert = (width?: number, height?: number) => {
            insertPastedImageNode(view, insertPos, { src: htmlSrc, alt, width: width ?? null, height: height ?? null });
          };
          img.onload = () => {
            const width = Math.round(Math.min(img.naturalWidth, 480));
            insert(width, Math.round(width / (img.naturalWidth / img.naturalHeight)));
          };
          // Some sources block hotlinked loads in this context (e.g. referrer
          // checks) — still insert by URL with no explicit size rather than
          // silently dropping the paste; CSS max-width handles display.
          img.onerror = () => insert();
          img.src = htmlSrc;
          return true;
        }

        const items = event.clipboardData?.items;
        if (!items) return false;
        const imageItem = Array.from(items).find((item) => item.type.startsWith("image/"));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;

        event.preventDefault();
        const src = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
          const naturalRatio = img.naturalWidth / img.naturalHeight;
          const width = Math.round(Math.min(img.naturalWidth, 480));
          const height = Math.round(width / naturalRatio);
          const uploadId = registerPendingImage(file);
          const insertPos = view.state.selection.from;
          insertPastedImageNode(view, insertPos, {
            src,
            alt: "Product image",
            width,
            height,
            "data-upload-id": uploadId,
            "data-pending-upload": "true",
          });
        };
        img.src = src;
        return true;
      },
      handleDOMEvents: {
        dblclick: (view, event) => {
          const target = event.target;
          if (!(target instanceof HTMLImageElement)) return false;
          const pos = view.posAtDOM(target, 0);
          if (pos == null || pos < 0) return false;
          const resolved = view.state.doc.resolve(pos);
          const isAfterImage = resolved.nodeAfter?.type.name === "image";
          const isBeforeImage = resolved.nodeBefore?.type.name === "image";
          if (!isAfterImage && !isBeforeImage) return false;
          const node = isAfterImage ? resolved.nodeAfter! : resolved.nodeBefore!;
          const nodePos = isAfterImage ? pos : pos - node.nodeSize;
          if (view.nodeDOM(nodePos) !== target) return false;
          // The single click preceding this dblclick already left the image
          // as a NodeSelection (that's what shows the selected-image
          // outline). If it stays that way while the edit dialog is open,
          // closing the dialog (Cancel or Save) and then inserting a new
          // image elsewhere via the toolbar would replace this NodeSelection
          // instead of inserting beside it. Move the cursor just after the
          // image so it's no longer "the current selection" once the dialog
          // closes — we already captured its position/attrs in editingImage,
          // so we don't need the ProseMirror selection to track it anymore.
          const afterPos = Math.min(nodePos + node.nodeSize, view.state.doc.content.size);
          view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(afterPos))));
          setEditingImage({ pos: nodePos, attrs: node.attrs as EditingImage["attrs"] });
          setImageModalSession((s) => s + 1);
          setShowImageModal(true);
          return true;
        },
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-muted-300 bg-surface-0 focus-within:ring-2 focus-within:ring-brand-500">
      <Toolbar
        editor={editor}
        onOpenImageModal={() => {
          setEditingImage(null);
          setImageModalSession((s) => s + 1);
          setShowImageModal(true);
        }}
        onOpenLinkModal={() => setShowLinkModal(true)}
      />
      <EditorContent editor={editor} />
      <ImageInsertModal
        key={imageModalSession}
        editor={editor}
        open={showImageModal}
        onOpenChange={(next) => {
          setShowImageModal(next);
          if (!next) setEditingImage(null);
        }}
        editingImage={editingImage}
      />
      <LinkModal editor={editor} open={showLinkModal} onOpenChange={setShowLinkModal} />
    </div>
  );
}
