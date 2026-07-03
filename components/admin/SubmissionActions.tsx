"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export function SubmissionActions({
  id,
  status,
}: {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function setStatus(next: "APPROVED" | "REJECTED") {
    setIsPending(true);
    try {
      const res = await fetch(`/api/admin/submitted-coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("update failed");
      router.refresh();
    } catch {
      toast.error("Failed to update submission.");
    } finally {
      setIsPending(false);
    }
  }

  if (status !== "PENDING") {
    return (
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium",
          status === "APPROVED" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
        )}
      >
        {status === "APPROVED" ? "Approved" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setStatus("APPROVED")}
        disabled={isPending}
        aria-label="Approve submission"
        className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setStatus("REJECTED")}
        disabled={isPending}
        aria-label="Reject submission"
        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
