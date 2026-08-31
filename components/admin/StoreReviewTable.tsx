"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { Eye, Trash2 } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";

export interface StoreReviewRow {
  storeId: string;
  storeName: string;
  storeLogoUrl: string;
  averageRating: number;
  reviewCount: number;
  newCount: number;
  hiddenCount: number;
}

export function StoreReviewTable({ rows }: { rows: StoreReviewRow[] }) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<StoreReviewRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/store/${pendingDelete.storeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      toast.success(`Deleted ${pendingDelete.reviewCount} review(s) for ${pendingDelete.storeName}.`);
      setPendingDelete(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete reviews.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Number Review</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.storeId}
                onClick={() => router.push(`/admin/reviews/${row.storeId}`)}
                className="cursor-pointer border-t border-muted-200 hover:bg-surface-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-muted-200 bg-surface-100">
                      {row.storeLogoUrl && (
                        <Image
                          src={row.storeLogoUrl}
                          alt={row.storeName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <span className="font-medium text-brand-950">{row.storeName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Rating value={row.averageRating} size={14} />
                </td>
                <td className="px-4 py-3 text-muted-600">{row.reviewCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {row.newCount > 0 && (
                      <span className="rounded-full border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {row.newCount} new
                      </span>
                    )}
                    {row.hiddenCount > 0 && (
                      <span className="rounded-full border border-muted-300 bg-surface-100 px-2 py-0.5 text-xs font-medium text-muted-600">
                        {row.hiddenCount} hidden
                      </span>
                    )}
                    {row.newCount === 0 && row.hiddenCount === 0 && (
                      <span className="text-xs text-muted-400">All read</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/admin/reviews/${row.storeId}`}
                      prefetch={false}
                      aria-label={`View reviews for ${row.storeName}`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(row)}
                      aria-label={`Delete all reviews for ${row.storeName}`}
                      className="rounded-lg p-1.5 text-muted-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-500">
                  No reviews yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete confirmation"
      >
        <p className="text-sm text-muted-600">
          Delete all{" "}
          <span className="font-medium text-brand-950">{pendingDelete?.reviewCount ?? 0}</span> review(s)
          for <span className="font-medium text-brand-950">{pendingDelete?.storeName}</span>? This
          can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
