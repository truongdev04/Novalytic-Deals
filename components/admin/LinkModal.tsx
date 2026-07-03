"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function LinkModal({
  editor,
  open,
  onOpenChange,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [url, setUrl] = useState("");
  const [wasOpen, setWasOpen] = useState(false);

  // Seed the input from the current link (if any) each time the modal opens
  // — computed during render, not an effect, so it can't cascade renders.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    }
  }

  function handleApply() {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    onOpenChange(false);
  }

  function handleRemove() {
    editor.chain().focus().unsetLink().run();
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Insert link" className="max-w-md">
      <label className="mb-1.5 block text-sm font-medium text-brand-950">URL</label>
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleApply();
          }
        }}
        placeholder="https://example.com"
        className="w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      />
      <div className="mt-5 flex justify-end gap-2">
        {editor.isActive("link") && (
          <Button variant="outline" onClick={handleRemove}>
            Remove link
          </Button>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Insert
        </Button>
      </div>
    </Modal>
  );
}
