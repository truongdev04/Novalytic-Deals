"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { parseFaqPaste, type ParsedFaqItem } from "@/lib/parseFaqPaste";

export function FaqPasteModal({
  open,
  onOpenChange,
  onParsed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParsed: (items: ParsedFaqItem[]) => void;
}) {
  const [raw, setRaw] = useState("");
  const preview = parseFaqPaste(raw);

  function handleApply() {
    if (preview.length === 0) return;
    onParsed(preview);
    setRaw("");
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Paste FAQs" className="max-w-3xl">
      <p className="text-sm text-muted-600">
        Paste a list of questions and answers — one pair per block, separated by a blank line, or
        using <span className="font-medium text-brand-950">Q:</span> /{" "}
        <span className="font-medium text-brand-950">A:</span> markers.
      </p>
      <textarea
        autoFocus
        rows={8}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"Q: What is your return policy?\nA: 30-day returns on unused items.\n\nQ: Do you ship internationally?\nA: Yes, to over 40 countries."}
        className="mt-3 w-full rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      />
      <p className="mt-2 text-xs text-muted-500">
        {preview.length > 0
          ? `${preview.length} question${preview.length === 1 ? "" : "s"} detected.`
          : "No questions detected yet."}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply} disabled={preview.length === 0}>
          Add {preview.length || ""} FAQ{preview.length === 1 ? "" : "s"}
        </Button>
      </div>
    </Modal>
  );
}
