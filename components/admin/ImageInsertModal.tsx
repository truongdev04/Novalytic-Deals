"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Link2, Unlink } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { registerPendingImage } from "@/lib/richTextImageUpload";

export function ImageInsertModal({
  editor,
  open,
  onOpenChange,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [ratioLocked, setRatioLocked] = useState(true);
  const naturalRatio = useRef<number | null>(null);

  function reset() {
    setFile(null);
    setPreviewUrl("");
    setAlt("");
    setWidth("");
    setHeight("");
    setRatioLocked(true);
    naturalRatio.current = null;
  }

  function handleFileChange(selected: File) {
    const url = URL.createObjectURL(selected);
    const img = new window.Image();
    img.onload = () => {
      naturalRatio.current = img.naturalWidth / img.naturalHeight;
      const initialWidth = Math.min(img.naturalWidth, 480);
      setWidth(String(Math.round(initialWidth)));
      setHeight(String(Math.round(initialWidth / naturalRatio.current)));
    };
    img.src = url;
    setFile(selected);
    setPreviewUrl(url);
  }

  function handleWidthChange(next: string) {
    setWidth(next);
    if (ratioLocked && naturalRatio.current && next) {
      setHeight(String(Math.round(Number(next) / naturalRatio.current)));
    }
  }

  function handleHeightChange(next: string) {
    setHeight(next);
    if (ratioLocked && naturalRatio.current && next) {
      setWidth(String(Math.round(Number(next) * naturalRatio.current)));
    }
  }

  function handleInsert() {
    if (!file || !alt.trim()) return;
    const uploadId = registerPendingImage(file);
    editor
      .chain()
      .focus()
      .setImage({
        src: previewUrl,
        alt: alt.trim(),
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        "data-upload-id": uploadId,
        "data-pending-upload": "true",
      } as never)
      .run();
    reset();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Insert image"
      className="max-w-lg"
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

      {previewUrl ? (
        <div className="relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-muted-200 bg-surface-100">
          <Image src={previewUrl} alt="" fill sizes="400px" className="object-contain" unoptimized />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-3 flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-muted-300 bg-surface-100 text-sm text-muted-500 hover:bg-surface-200"
        >
          Click to choose an image
        </button>
      )}
      {previewUrl && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-3 text-xs font-medium text-brand-600 hover:underline"
        >
          Choose a different image
        </button>
      )}

      <label className="mb-1.5 block text-sm font-medium text-brand-950">
        Alt text<span className="text-red-600"> *</span>
      </label>
      <input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Describe this image for search engines and screen readers"
        className="w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      />

      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-brand-950">Width (px)</label>
          <input
            type="number"
            min={1}
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setRatioLocked((v) => !v)}
          title={ratioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
          className="mb-0.5 rounded-lg border border-muted-300 p-2 text-muted-600 hover:bg-surface-100"
        >
          {ratioLocked ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-brand-950">Height (px)</label>
          <input
            type="number"
            min={1}
            value={height}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-400">
        Compressed to .webp and uploaded to Cloudinary when you save the store.
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleInsert} disabled={!file || !alt.trim()}>
          Insert image
        </Button>
      </div>
    </Modal>
  );
}
