"use client";

import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { buildQueryUrl } from "@/lib/utils";
import type { getNewsletterSubscribersAdminPaginated } from "@/lib/data/newsletter";

type Subscriber = Awaited<ReturnType<typeof getNewsletterSubscribersAdminPaginated>>["items"][number];

export function NewsletterTable({
  subscribers,
  total,
  page,
  pageSize,
}: {
  subscribers: Subscriber[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildQueryUrl(pathname, searchParams, updates));
  }

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
            {subscribers.map((subscriber) => (
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
        onPageChange={(p) => navigate({ page: String(p) })}
        onPageSizeChange={(size) => navigate({ size: String(size), page: undefined })}
      />
    </div>
  );
}
