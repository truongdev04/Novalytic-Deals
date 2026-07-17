"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, ListChecks, Pencil, Search, Trash2 } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Deal, DealType, Event, Store } from "@/types";

const STORE_FILTER_ALL = "all";
const TYPE_FILTER_ALL = "all";
const EVENT_FILTER_ALL = "all";
const EVENT_FILTER_UNCATEGORIZED = "uncategorized";
const BOOL_FILTER_ALL = "all";

const DEAL_TYPES: DealType[] = ["DEAL", "CODE"];

export function DealTable({
  deals,
  stores,
  events,
}: {
  deals: Deal[];
  stores: Store[];
  events: Event[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState(STORE_FILTER_ALL);
  const [typeFilter, setTypeFilter] = useState(TYPE_FILTER_ALL);
  const [eventFilter, setEventFilter] = useState(EVENT_FILTER_ALL);
  const [featuredFilter, setFeaturedFilter] = useState(BOOL_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(BOOL_FILTER_ALL);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [draftTypeFilter, setDraftTypeFilter] = useState(TYPE_FILTER_ALL);
  const [draftEventFilter, setDraftEventFilter] = useState(EVENT_FILTER_ALL);
  const [draftFeaturedFilter, setDraftFeaturedFilter] = useState(BOOL_FILTER_ALL);
  const [draftStatusFilter, setDraftStatusFilter] = useState(BOOL_FILTER_ALL);

  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);

  const storeOptions = useMemo(
    () => [
      { value: STORE_FILTER_ALL, label: "All stores" },
      ...stores.map((store) => ({ value: store.id, label: store.name })),
    ],
    [stores]
  );

  const eventOptions = useMemo(
    () => [
      { value: null, label: "Uncategorized" },
      ...events.map((event) => ({ value: event.id, label: event.name })),
    ],
    [events]
  );

  const typeFilterOptions = useMemo(
    () => [
      { value: TYPE_FILTER_ALL, label: "All types" },
      ...DEAL_TYPES.map((type) => ({ value: type, label: type })),
    ],
    []
  );

  const eventFilterOptions = useMemo(
    () => [
      { value: EVENT_FILTER_ALL, label: "All events" },
      { value: EVENT_FILTER_UNCATEGORIZED, label: "Uncategorized" },
      ...events.map((event) => ({ value: event.id, label: event.name })),
    ],
    [events]
  );

  const featuredFilterOptions = [
    { value: BOOL_FILTER_ALL, label: "All featured" },
    { value: "true", label: "Featured" },
    { value: "false", label: "Not featured" },
  ];

  const statusFilterOptions = [
    { value: BOOL_FILTER_ALL, label: "All statuses" },
    { value: "true", label: "Active" },
    { value: "false", label: "Hidden" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((deal) => {
      if (q && !deal.name.toLowerCase().includes(q)) return false;

      if (storeFilter !== STORE_FILTER_ALL && deal.storeId !== storeFilter) return false;

      if (typeFilter !== TYPE_FILTER_ALL && deal.type !== typeFilter) return false;

      if (eventFilter !== EVENT_FILTER_ALL) {
        const currentEventId = deal.eventId ?? null;
        if (eventFilter === EVENT_FILTER_UNCATEGORIZED) {
          if (currentEventId !== null) return false;
        } else if (currentEventId !== eventFilter) {
          return false;
        }
      }

      if (featuredFilter !== BOOL_FILTER_ALL) {
        if (String(deal.isFeatured) !== featuredFilter) return false;
      }

      if (statusFilter !== BOOL_FILTER_ALL) {
        if (String(deal.isActive) !== statusFilter) return false;
      }

      return true;
    });
  }, [deals, query, storeFilter, typeFilter, eventFilter, featuredFilter, statusFilter]);

  const hasActiveFilters =
    typeFilter !== TYPE_FILTER_ALL ||
    eventFilter !== EVENT_FILTER_ALL ||
    featuredFilter !== BOOL_FILTER_ALL ||
    statusFilter !== BOOL_FILTER_ALL;

  function clearAllFilters() {
    setTypeFilter(TYPE_FILTER_ALL);
    setEventFilter(EVENT_FILTER_ALL);
    setFeaturedFilter(BOOL_FILTER_ALL);
    setStatusFilter(BOOL_FILTER_ALL);
    setDraftTypeFilter(TYPE_FILTER_ALL);
    setDraftEventFilter(EVENT_FILTER_ALL);
    setDraftFeaturedFilter(BOOL_FILTER_ALL);
    setDraftStatusFilter(BOOL_FILTER_ALL);
  }

  function openFilterModal() {
    setDraftTypeFilter(typeFilter);
    setDraftEventFilter(eventFilter);
    setDraftFeaturedFilter(featuredFilter);
    setDraftStatusFilter(statusFilter);
    setShowFilterModal(true);
  }

  function applyFilters() {
    setTypeFilter(draftTypeFilter);
    setEventFilter(draftEventFilter);
    setFeaturedFilter(draftFeaturedFilter);
    setStatusFilter(draftStatusFilter);
    setShowFilterModal(false);
  }

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  const pagedIds = useMemo(() => paged.map((d) => d.id), [paged]);
  const allPagedSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));

  function toggleSelectionMode() {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPagedSelected) {
        pagedIds.forEach((id) => next.delete(id));
      } else {
        pagedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/admin/deals/${id}`, { method: "DELETE" }))
      );
      if (results.some((res) => !res.ok)) throw new Error("delete failed");
      toast.success(`Deleted ${ids.length} deal(s).`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowBulkDeleteConfirm(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete selected deals.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search deals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <div className="w-48">
          <SingleSelectDropdown
            options={storeOptions}
            value={storeFilter}
            onChange={setStoreFilter}
            placeholder="All stores"
            searchable
            searchPlaceholder="Search stores..."
          />
        </div>

        <button
          type="button"
          onClick={openFilterModal}
          className="flex items-center gap-1.5 rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
          >
            Clear All
          </button>
        )}
      </div>

      <Modal open={showFilterModal} onOpenChange={setShowFilterModal} title="Filters">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-950">Type</label>
            <SingleSelectDropdown
              options={typeFilterOptions}
              value={draftTypeFilter}
              onChange={setDraftTypeFilter}
              placeholder="All types"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-950">Event</label>
            <SingleSelectDropdown
              options={eventFilterOptions}
              value={draftEventFilter}
              onChange={setDraftEventFilter}
              placeholder="All events"
              searchable
              searchPlaceholder="Search events..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-950">Featured</label>
            <SingleSelectDropdown
              options={featuredFilterOptions}
              value={draftFeaturedFilter}
              onChange={setDraftFeaturedFilter}
              placeholder="All featured"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-950">Status</label>
            <SingleSelectDropdown
              options={statusFilterOptions}
              value={draftStatusFilter}
              onChange={setDraftStatusFilter}
              placeholder="All statuses"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowFilterModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={applyFilters}>
            Apply filter
          </Button>
        </div>
      </Modal>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={
              selectionMode
                ? "flex items-center gap-1.5 rounded-lg border border-brand-400 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700"
                : "flex items-center gap-1.5 rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
            }
          >
            <ListChecks className="h-4 w-4" />
            Select Items
          </button>

          {selectionMode && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
            >
              {allPagedSelected ? "Deselect all" : "Select All"}
            </button>
          )}
        </div>

        {selectionMode && selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setShowBulkDeleteConfirm(true)}
            disabled={isBulkDeleting}
            className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isBulkDeleting ? "Deleting..." : `Delete (${selectedIds.size})`}
          </button>
        )}
      </div>

      <Modal
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Delete confirmation"
      >
        <p className="text-sm text-muted-600">
          Delete <span className="font-medium text-brand-950">{selectedIds.size}</span> selected
          deal(s)? This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkDeleteConfirm(false)}
            disabled={isBulkDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              {selectionMode && <th className="w-10 px-4 py-3" />}
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((deal) => {
              const store = storeById.get(deal.storeId);
              const currentEventId = deal.eventId ?? null;
              return (
                <tr key={deal.id} className="border-t border-muted-200">
                  {selectionMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedIds.has(deal.id)}
                        onChange={() => toggleOne(deal.id)}
                        aria-label={`Select ${deal.name}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-muted-200 bg-surface-100">
                      <Image src={deal.imageUrl} alt={deal.name} fill sizes="44px" className="object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-950">{deal.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {store && (
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-muted-200 bg-surface-100">
                          <Image src={store.logoUrl} alt={store.name} fill sizes="32px" className="object-cover" />
                        </div>
                      )}
                      <span className="text-muted-600">{store?.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-600">{deal.type}</td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/deals/${deal.id}`}
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
                      endpoint={`/api/admin/deals/${deal.id}`}
                      field="isFeatured"
                      value={deal.isFeatured}
                      options={[
                        { value: true, label: "Featured" },
                        { value: false, label: "Not featured" },
                      ]}
                      triggerClassName="w-28"
                      badgeClassName={
                        deal.isFeatured
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-muted-300 text-muted-500 hover:bg-surface-100"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/deals/${deal.id}`}
                      field="isActive"
                      value={deal.isActive}
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Hidden" },
                      ]}
                      triggerClassName="w-20"
                      badgeClassName={
                        deal.isActive
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-red-200 bg-red-50 text-red-600"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/deals/${deal.id}`}
                        aria-label={`Edit ${deal.name}`}
                        className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton endpoint={`/api/admin/deals/${deal.id}`} confirmLabel={deal.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={selectionMode ? 9 : 8} className="px-4 py-6 text-center text-muted-500">
                  No deals found.
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
