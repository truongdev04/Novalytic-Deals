"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function DeleteButton({ endpoint, confirmLabel }: { endpoint: string; confirmLabel: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function onDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete.");
      }
      toast.success("Deleted.");
      setShowConfirm(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        aria-label={`Delete ${confirmLabel}`}
        className="rounded-lg p-1.5 text-muted-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Modal open={showConfirm} onOpenChange={setShowConfirm} title="Delete confirmation">
        <p className="text-sm text-muted-600">
          Delete <span className="font-medium text-brand-950">{confirmLabel}</span>? This can&apos;t
          be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
