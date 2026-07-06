"use client";

import { useRef, useState } from "react";
import { Link2, Maximize, Unlink } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { registerPendingImage } from "@/lib/richTextImageUpload";
import { borderStyleProps, hspaceStyleProps, vspaceStyleProps, type ImagePosition } from "@/lib/richTextImageStyle";

export interface EditingImage {
  pos: number;
  attrs: {
    src?: string;
    alt?: string;
    width?: number | string | null;
    height?: number | string | null;
    "data-full-width"?: string | null;
    "data-position"?: string | null;
    borderWidth?: number | string | null;
    hspace?: number | string | null;
    vspace?: number | string | null;
  };
}

const fieldInputClassName =
  "w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:bg-surface-100 disabled:text-muted-400";
const fieldLabelClassName = "mb-1.5 block text-sm font-medium text-brand-950";

export function ImageInsertModal({
  editor,
  open,
  onOpenChange,
  editingImage,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingImage?: EditingImage | null;
}) {
  // The parent remounts this component (via a changing `key`) every time the
  // modal is opened, so these lazy initializers double as the "prefill from
  // editingImage" logic without needing an effect to sync state on open.
  const initialFullWidth = editingImage?.attrs["data-full-width"] === "true";
  const initialPosition = (initialFullWidth ? "" : (editingImage?.attrs["data-position"] ?? "")) as ImagePosition;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(() => editingImage?.attrs.src ?? "");
  const [alt, setAlt] = useState(() => editingImage?.attrs.alt ?? "");
  const [width, setWidth] = useState(() =>
    initialFullWidth || !editingImage?.attrs.width ? "" : String(editingImage.attrs.width)
  );
  const [height, setHeight] = useState(() =>
    initialFullWidth || !editingImage?.attrs.height ? "" : String(editingImage.attrs.height)
  );
  const [ratioLocked, setRatioLocked] = useState(true);
  const [fullWidth, setFullWidth] = useState(initialFullWidth);
  const [position, setPosition] = useState<ImagePosition>(initialPosition);
  const [border, setBorder] = useState(() =>
    editingImage?.attrs.borderWidth ? String(editingImage.attrs.borderWidth) : ""
  );
  const [hspace, setHspace] = useState(() =>
    initialFullWidth || initialPosition === "center" || !editingImage?.attrs.hspace
      ? ""
      : String(editingImage.attrs.hspace)
  );
  const [vspace, setVspace] = useState(() =>
    editingImage?.attrs.vspace ? String(editingImage.attrs.vspace) : ""
  );
  // Replaces a plain ratio ref with both dimensions, so "exit Max Width" can
  // recompute width from natural size (capped at 480) like the initial pick.
  const naturalSize = useRef<{ width: number; height: number } | null>(null);

  // Single source of truth for the fullWidth/position/hspace mutual exclusion,
  // reused by both the live preview and handleConfirm so they can't drift.
  const effectivePosition: ImagePosition = fullWidth ? "" : position;
  const effectiveHspace = fullWidth ? "" : hspace;

  function reset() {
    setFile(null);
    setPreviewUrl("");
    setAlt("");
    setWidth("");
    setHeight("");
    setRatioLocked(true);
    setFullWidth(false);
    setPosition("");
    setBorder("");
    setHspace("");
    setVspace("");
    naturalSize.current = null;
  }

  function handleFileChange(selected: File) {
    const url = URL.createObjectURL(selected);
    const img = new window.Image();
    img.onload = () => {
      naturalSize.current = { width: img.naturalWidth, height: img.naturalHeight };
      const initialWidth = Math.min(img.naturalWidth, 480);
      setWidth(String(Math.round(initialWidth)));
      setHeight(String(Math.round(initialWidth / (img.naturalWidth / img.naturalHeight))));
    };
    img.src = url;
    setFile(selected);
    setPreviewUrl(url);
  }

  function handleWidthChange(next: string) {
    setFullWidth(false);
    setWidth(next);
    if (ratioLocked && naturalSize.current && next) {
      const ratio = naturalSize.current.width / naturalSize.current.height;
      setHeight(String(Math.round(Number(next) / ratio)));
    }
  }

  function handleHeightChange(next: string) {
    setFullWidth(false);
    setHeight(next);
    if (ratioLocked && naturalSize.current && next) {
      const ratio = naturalSize.current.width / naturalSize.current.height;
      setWidth(String(Math.round(Number(next) * ratio)));
    }
  }

  function handleEnterMaxWidth() {
    setFullWidth(true);
    setWidth("");
    setHeight("");
    setPosition("");
  }

  function handleExitMaxWidth() {
    setFullWidth(false);
    const natural = naturalSize.current;
    if (natural) {
      const initialWidth = Math.min(natural.width, 480);
      setWidth(String(Math.round(initialWidth)));
      setHeight(String(Math.round(initialWidth * (natural.height / natural.width))));
    }
  }

  function handleConfirm() {
    const resolvedAlt = alt.trim() || "Product image";
    const commonAttrs = {
      alt: resolvedAlt,
      width: fullWidth ? null : width ? Number(width) : null,
      height: fullWidth ? null : height ? Number(height) : null,
      "data-full-width": fullWidth ? "true" : null,
      "data-position": effectivePosition || null,
      borderWidth: border ? Number(border) : null,
      hspace: effectiveHspace ? Number(effectiveHspace) : null,
      vspace: vspace ? Number(vspace) : null,
    };

    if (editingImage) {
      let attrs: Record<string, unknown> = { ...commonAttrs, src: editingImage.attrs.src };
      if (file) {
        const uploadId = registerPendingImage(file);
        attrs = { ...attrs, src: previewUrl, "data-upload-id": uploadId, "data-pending-upload": "true" };
      } else if (previewUrl !== editingImage.attrs.src) {
        // Manually edited to a different external URL — nothing pending to
        // upload, and any stale pending-upload markers from the original
        // node no longer apply to this src.
        attrs = { ...attrs, src: previewUrl, "data-upload-id": null, "data-pending-upload": null };
      }
      editor
        .chain()
        .focus()
        .setNodeSelection(editingImage.pos)
        .updateAttributes("image", attrs)
        // setNodeSelection above is only needed to target the update — leave
        // the cursor just after the image afterward instead of leaving it
        // node-selected, so the next unrelated "Insert image" doesn't
        // replace this one.
        .setTextSelection(editingImage.pos + 1)
        .run();
    } else {
      if (file) {
        const uploadId = registerPendingImage(file);
        editor
          .chain()
          .focus()
          .setImage({
            src: previewUrl,
            ...commonAttrs,
            "data-upload-id": uploadId,
            "data-pending-upload": "true",
          } as never)
          .run();
      } else if (previewUrl.trim()) {
        editor.chain().focus().setImage({ src: previewUrl.trim(), ...commonAttrs } as never).run();
      } else {
        return;
      }
    }
    reset();
    onOpenChange(false);
  }

  const previewStyle = {
    ...borderStyleProps(border || null),
    ...hspaceStyleProps(effectiveHspace || null, effectivePosition),
    ...vspaceStyleProps(vspace || null),
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={editingImage ? "Edit image" : "Insert image"}
      className="flex max-h-[85vh] max-w-4xl flex-col"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) handleFileChange(selected);
          e.target.value = "";
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column: form fields */}
          <div className="space-y-4">
            <div>
              <label className={fieldLabelClassName}>URL</label>
              <input
                value={previewUrl}
                onChange={(e) => {
                  setPreviewUrl(e.target.value);
                  setFile(null);
                }}
                placeholder="https://example.com/image.jpg — paste a link from Google, Facebook, etc."
                className={fieldInputClassName}
              />
            </div>

            <div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                {file ? "Change image" : "Upload Image"}
              </Button>
            </div>

            <div>
              <label className={fieldLabelClassName}>Alt text</label>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder='Describe this image for search engines and screen readers (defaults to "Product image")'
                className={fieldInputClassName}
              />
            </div>

            <div>
              <label className={fieldLabelClassName}>Width (px)</label>
              <input
                type="number"
                min={1}
                value={width}
                disabled={fullWidth}
                onChange={(e) => handleWidthChange(e.target.value)}
                className={fieldInputClassName}
              />
            </div>

            <div>
              <label className={fieldLabelClassName}>Height (px)</label>
              <input
                type="number"
                min={1}
                value={height}
                disabled={fullWidth}
                onChange={(e) => handleHeightChange(e.target.value)}
                className={fieldInputClassName}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRatioLocked((v) => !v)}
                disabled={fullWidth}
                title={ratioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                className="rounded-lg border border-muted-300 p-2 text-muted-600 hover:bg-surface-100 disabled:pointer-events-none disabled:opacity-40"
              >
                {ratioLocked ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => (fullWidth ? handleExitMaxWidth() : handleEnterMaxWidth())}
                title="Make image full width of the article, responsive on every device"
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-muted-300 px-3 py-2 text-sm font-medium text-muted-600 hover:bg-surface-100",
                  fullWidth && "border-brand-500 bg-brand-50 text-brand-700"
                )}
              >
                <Maximize className="h-4 w-4" />
                Max width
              </button>
            </div>

            <div>
              <label className={fieldLabelClassName}>Border (px)</label>
              <input
                type="number"
                min={0}
                value={border}
                onChange={(e) => setBorder(e.target.value)}
                className={fieldInputClassName}
              />
            </div>

            <div>
              <label className={fieldLabelClassName}>Horizontal spacing (px)</label>
              <input
                type="number"
                min={0}
                value={hspace}
                disabled={fullWidth || position === "center"}
                onChange={(e) => setHspace(e.target.value)}
                className={fieldInputClassName}
              />
              {!fullWidth && position === "center" && (
                <p className="mt-1 text-xs text-muted-400">Not applicable when Position is Center.</p>
              )}
            </div>

            <div>
              <label className={fieldLabelClassName}>Vertical spacing (px)</label>
              <input
                type="number"
                min={0}
                value={vspace}
                onChange={(e) => setVspace(e.target.value)}
                className={fieldInputClassName}
              />
            </div>

            <div>
              <label className={fieldLabelClassName}>Position</label>
              <select
                value={position}
                disabled={fullWidth}
                onChange={(e) => setPosition(e.target.value as ImagePosition)}
                className={fieldInputClassName}
              >
                <option value="">None</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
              {fullWidth && <p className="mt-1 text-xs text-muted-400">Not applicable when Max width is on.</p>}
            </div>

            <p className="text-xs text-muted-400">
              Compressed to .webp and uploaded to Cloudinary when you save the store.
            </p>
          </div>

          {/* Right column: live preview */}
          <div className="rounded-lg border border-muted-200 bg-surface-50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-500">Preview</p>
            <div className="rich-text-content overflow-hidden rounded-lg border border-muted-200 bg-surface-0 p-3 text-sm text-brand-950">
              <p>
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- needs real float/margin/border/data-position CSS for an accurate layout preview, which next/image can't reproduce.
                  <img
                    src={previewUrl}
                    alt=""
                    data-position={effectivePosition || undefined}
                    data-full-width={fullWidth ? "true" : undefined}
                    width={fullWidth ? undefined : Number(width) || undefined}
                    height={fullWidth ? undefined : Number(height) || undefined}
                    style={previewStyle}
                    onLoad={(event) => {
                      const target = event.currentTarget;
                      naturalSize.current = { width: target.naturalWidth, height: target.naturalHeight };
                      // Cover images with no persisted width/height (e.g. an
                      // external URL inserted without typing dimensions) —
                      // once the real size is known, fill the fields instead
                      // of leaving them blank, same formula as a fresh pick.
                      if (!fullWidth && !width && !height) {
                        const initialWidth = Math.min(target.naturalWidth, 480);
                        setWidth(String(Math.round(initialWidth)));
                        setHeight(String(Math.round(initialWidth * (target.naturalHeight / target.naturalWidth))));
                      }
                    }}
                  />
                )}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio praesent
                libero sed cursus ante dapibus diam. Sed nisi nulla quis sem at nibh elementum
                imperdiet duis sagittis ipsum praesent mauris fusce nec tellus sed augue semper
                porta. Mauris massa vestibulum lacinia arcu eget nulla class aptent taciti.
              </p>
            </div>
            {!previewUrl && (
              <p className="mt-2 text-xs text-muted-400">Choose an image to preview its position here.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-muted-200 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!editingImage && !file && !previewUrl.trim()}
        >
          {editingImage ? "Save changes" : "Insert image"}
        </Button>
      </div>
    </Modal>
  );
}
