"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import { renderCategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";

const SCROLL_STORAGE_KEY = "admin-events-scroll-y";
const LAST_EDITED_EVENT_KEY = "admin-events-last-id";

export function EventTable({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => event.name.toLowerCase().includes(q));
  }, [events, query]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  useEffect(() => {
    const shouldScrollTop = sessionStorage.getItem("admin-events-scroll-top");
    if (shouldScrollTop) {
      sessionStorage.removeItem("admin-events-scroll-top");
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      sessionStorage.removeItem(LAST_EDITED_EVENT_KEY);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    const savedY = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    const lastId = sessionStorage.getItem(LAST_EDITED_EVENT_KEY);
    if (!savedY && !lastId) return;

    const restore = () => {
      if (lastId) {
        const itemIndex = filtered.findIndex((e) => e.id === lastId);
        if (itemIndex !== -1) {
          const targetPage = Math.floor(itemIndex / pageSize) + 1;
          if (targetPage !== page) {
            setPage(targetPage);
          }
        }
        const row = document.getElementById(`event-row-${lastId}`);
        if (row) {
          row.scrollIntoView({ block: "center", behavior: "instant" });
          setHighlightedEventId(lastId);
          setTimeout(() => setHighlightedEventId(null), 2500);
          sessionStorage.removeItem(SCROLL_STORAGE_KEY);
          sessionStorage.removeItem(LAST_EDITED_EVENT_KEY);
          return true;
        }
      }
      if (savedY) {
        window.scrollTo({ top: Number(savedY), behavior: "instant" });
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
        sessionStorage.removeItem(LAST_EDITED_EVENT_KEY);
        return true;
      }
      return false;
    };

    if (!restore()) {
      const raf = requestAnimationFrame(() => {
        if (!restore()) {
          const timer = setTimeout(restore, 100);
          return () => clearTimeout(timer);
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [events, paged, filtered, pageSize, page, setPage]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Banner</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Stores</th>
              <th className="px-4 py-3">Coupons</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((event) => (
              <tr
                key={event.id}
                id={`event-row-${event.id}`}
                className={cn(
                  "border-t border-muted-200 transition-colors duration-1000",
                  highlightedEventId === event.id && "bg-brand-50"
                )}
              >
                <td className="px-4 py-3">
                  <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-muted-200 bg-brand-50 text-brand-600">
                    {renderCategoryIcon(event, { iconClassName: "h-4 w-4" })}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-brand-950">{event.name}</td>
                <td className="px-4 py-3">
                  {event.bannerUrl ? (
                    <div className="relative h-11 w-16 overflow-hidden rounded-md border border-muted-200 bg-surface-100">
                      <Image
                        src={event.bannerUrl}
                        alt={event.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-11 w-16 rounded-md border border-dashed border-muted-300 bg-surface-100" />
                  )}
                </td>
                <td className="px-4 py-3 text-muted-600">
                  {event.startsAt ? new Date(event.startsAt).toLocaleDateString("en-US") : "—"}
                </td>
                <td className="px-4 py-3 text-muted-600">
                  {event.endsAt ? new Date(event.endsAt).toLocaleDateString("en-US") : "—"}
                </td>
                <td className="px-4 py-3 text-muted-600">{event.featuredStoreIds.length}</td>
                <td className="px-4 py-3 text-muted-600">{event.featuredCouponIds.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      prefetch={false}
                      onClick={() => {
                        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
                        sessionStorage.setItem(LAST_EDITED_EVENT_KEY, event.id);
                      }}
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted-500">
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
