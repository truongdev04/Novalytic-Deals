"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { Category, Event, Store } from "@/types";

const EVENT_FILTER_ALL = "all";
const EVENT_FILTER_UNCATEGORIZED = "uncategorized";
const BOOL_FILTER_ALL = "all";

const selectClassName =
  "rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm text-brand-950 focus:border-brand-400 focus:outline-none";

export function StoreTable({
  stores,
  categories,
  events,
}: {
  stores: Store[];
  categories: Category[];
  events: Event[];
}) {
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState(EVENT_FILTER_ALL);
  const [featuredFilter, setFeaturedFilter] = useState(BOOL_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(BOOL_FILTER_ALL);

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const eventOptions = useMemo(
    () => [
      { value: null, label: "Uncategorized" },
      ...events.map((event) => ({ value: event.id, label: event.name })),
    ],
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((store) => {
      if (q && !store.name.toLowerCase().includes(q)) return false;

      if (eventFilter !== EVENT_FILTER_ALL) {
        const currentEventId = store.eventId ?? null;
        if (eventFilter === EVENT_FILTER_UNCATEGORIZED) {
          if (currentEventId !== null) return false;
        } else if (currentEventId !== eventFilter) {
          return false;
        }
      }

      if (featuredFilter !== BOOL_FILTER_ALL) {
        if (String(store.isFeatured) !== featuredFilter) return false;
      }

      if (statusFilter !== BOOL_FILTER_ALL) {
        if (String(store.isActive) !== statusFilter) return false;
      }

      return true;
    });
  }, [stores, query, eventFilter, featuredFilter, statusFilter]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search stores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className={selectClassName}
        >
          <option value={EVENT_FILTER_ALL}>All events</option>
          <option value={EVENT_FILTER_UNCATEGORIZED}>Uncategorized</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>

        <select
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          className={selectClassName}
        >
          <option value={BOOL_FILTER_ALL}>All featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClassName}
        >
          <option value={BOOL_FILTER_ALL}>All statuses</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((store) => {
              const currentEventId = store.eventId ?? null;
              return (
                <tr key={store.id} className="border-t border-muted-200">
                  <td className="px-4 py-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-full border border-muted-200 bg-surface-100">
                      <Image src={store.logoUrl} alt={store.name} fill sizes="44px" className="object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-950">{store.name}</td>
                  <td className="px-4 py-3 text-muted-600">
                    {store.categoryIds.map((id) => categoryNameById.get(id)).filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-600">{store.rating.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/stores/${store.id}`}
                      field="eventId"
                      value={currentEventId}
                      options={eventOptions}
                      triggerClassName="w-32"
                      badgeClassName={
                        currentEventId
                          ? "border-accent-300 bg-accent-50 text-accent-700"
                          : "border-muted-300 text-muted-500 hover:bg-surface-100"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/stores/${store.id}`}
                      field="isFeatured"
                      value={store.isFeatured}
                      options={[
                        { value: true, label: "Featured" },
                        { value: false, label: "Not featured" },
                      ]}
                      triggerClassName="w-28"
                      badgeClassName={
                        store.isFeatured
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-muted-300 text-muted-500 hover:bg-surface-100"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/stores/${store.id}`}
                      field="isActive"
                      value={store.isActive}
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Hidden" },
                      ]}
                      triggerClassName="w-20"
                      badgeClassName={
                        store.isActive
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-red-200 bg-red-50 text-red-600"
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                    {new Date(store.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        aria-label={`Edit ${store.name}`}
                        className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton endpoint={`/api/admin/stores/${store.id}`} confirmLabel={store.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted-500">
                  No stores found.
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
