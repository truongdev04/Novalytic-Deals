"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { Event } from "@/types";

export function EventTable({ events }: { events: Event[] }) {
  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(events);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Stores</th>
              <th className="px-4 py-3">Coupons</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((event) => (
              <tr key={event.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{event.name}</td>
                <td className="px-4 py-3 text-muted-600">
                  {new Date(event.startsAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-muted-600">
                  {new Date(event.endsAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-muted-600">{event.featuredStoreIds.length}</td>
                <td className="px-4 py-3 text-muted-600">{event.featuredCouponIds.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      aria-label={`Edit ${event.name}`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton endpoint={`/api/admin/events/${event.id}`} confirmLabel={event.name} />
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-500">
                  No events found.
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
