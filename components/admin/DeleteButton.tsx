"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";

export function DeleteButton({ endpoint, confirmLabel }: { endpoint: string; confirmLabel: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Delete ${confirmLabel}? This can't be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      toast.success("Deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isDeleting}
      aria-label={`Delete ${confirmLabel}`}
      className="rounded-lg p-1.5 text-muted-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
