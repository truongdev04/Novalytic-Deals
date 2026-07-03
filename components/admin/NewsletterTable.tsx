"use client";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { getNewsletterSubscribers } from "@/lib/data/newsletter";

type Subscriber = Awaited<ReturnType<typeof getNewsletterSubscribers>>[number];

export function NewsletterTable({ subscribers }: { subscribers: Subscriber[] }) {
  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(subscribers);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((subscriber) => (
              <tr key={subscriber.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{subscriber.email}</td>
                <td className="px-4 py-3 text-muted-600">
                  {subscriber.unsubscribedAt
                    ? "Unsubscribed"
                    : subscriber.confirmedAt
                      ? "Confirmed"
                      : "Pending confirmation"}
                </td>
                <td className="px-4 py-3 text-muted-600">{subscriber.source ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton
                    endpoint={`/api/admin/newsletter/${subscriber.id}`}
                    confirmLabel={subscriber.email}
                  />
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-500">
                  No subscribers found.
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
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
