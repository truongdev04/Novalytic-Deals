"use client";

import { useRef, useState } from "react";
import { Extension } from "@tiptap/core";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
import { ImageInsertModal } from "@/components/admin/ImageInsertModal";
import { LinkModal } from "@/components/admin/LinkModal";

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
    };
  },
});

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
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
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
        class: cn("rich-text-content px-4 py-2.5 text-sm text-brand-950 focus:outline-none", minHeightClassName),
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-muted-300 bg-surface-0 focus-within:ring-2 focus-within:ring-brand-500">
      <Toolbar
        editor={editor}
        onOpenImageModal={() => setShowImageModal(true)}
        onOpenLinkModal={() => setShowLinkModal(true)}
      />
      <EditorContent editor={editor} />
      <ImageInsertModal editor={editor} open={showImageModal} onOpenChange={setShowImageModal} />
      <LinkModal editor={editor} open={showLinkModal} onOpenChange={setShowLinkModal} />
    </div>
  );
}
