"use client";

import { useMemo } from "react";
import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleButton } from "@/components/admin/ToggleButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { buildQueryUrl } from "@/lib/utils";
import type { Review, Store } from "@/types";

export function ReviewTable({
  reviews,
  stores,
  total,
  page,
  pageSize,
}: {
  reviews: Review[];
  stores: Store[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildQueryUrl(pathname, searchParams, updates));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-t border-muted-200">
                <td className="px-4 py-3 text-muted-600">
                  {storeById.get(review.storeId)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-600">{review.authorName}</td>
                <td className="px-4 py-3 text-muted-600">{review.rating}/5</td>
                <td className="px-4 py-3 font-medium text-brand-950">{review.title}</td>
                <td className="px-4 py-3">
                  <ToggleButton
                    endpoint={`/api/admin/reviews/${review.id}`}
                    field="isApproved"
                    value={review.isApproved}
                    label={review.isApproved ? "Approved" : "Pending"}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton endpoint={`/api/admin/reviews/${review.id}`} confirmLabel={review.title} />
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-500">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => navigate({ page: String(p) })}
        onPageSizeChange={(size) => navigate({ size: String(size), page: undefined })}
      />
    </div>
  );
}
