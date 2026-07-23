"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { Filter, ListChecks, Pencil, Search, Trash2 } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminDropdownSelect } from "@/components/admin/AdminDropdownSelect";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { buildQueryUrl } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Coupon, Store } from "@/types";

const STORE_FILTER_ALL = "all";
const BOOL_FILTER_ALL = "all";
const TYPE_FILTER_ALL = "all";

const typeFilterOptions = [
  { value: TYPE_FILTER_ALL, label: "All types" },
  { value: "CODE", label: "CODE" },
  { value: "DEAL", label: "DEAL" },
  { value: "FREESHIP", label: "FREESHIP" },
];

const featuredFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All featured" },
  { value: "true", label: "Featured" },
  { value: "false", label: "Not featured" },
];

const statusFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
];

const verifiedFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All verified" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

const exclusiveFilterOptions = [
  { value: BOOL_FILTER_ALL, label: "All exclusive" },
  { value: "true", label: "Exclusive" },
  { value: "false", label: "Not exclusive" },
];

export function CouponTable({
  coupons,
  stores,
  total,
  page,
  pageSize,
}: {
  coupons: Coupon[];
  stores: Store[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const storeFilter = searchParams.get("store") ?? STORE_FILTER_ALL;
  const typeFilter = searchParams.get("type") ?? TYPE_FILTER_ALL;
  const featuredFilter = searchParams.get("featured") ?? BOOL_FILTER_ALL;
  const statusFilter = searchParams.get("status") ?? BOOL_FILTER_ALL;
  const verifiedFilter = searchParams.get("verified") ?? BOOL_FILTER_ALL;
  const exclusiveFilter = searchParams.get("exclusive") ?? BOOL_FILTER_ALL;
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    navigate({ q: debouncedQuery || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const [draftTypeFilter, setDraftTypeFilter] = useState(TYPE_FILTER_ALL);
  const [draftFeaturedFilter, setDraftFeaturedFilter] = useState(BOOL_FILTER_ALL);
  const [draftStatusFilter, setDraftStatusFilter] = useState(BOOL_FILTER_ALL);
  const [draftVerifiedFilter, setDraftVerifiedFilter] = useState(BOOL_FILTER_ALL);
  const [draftExclusiveFilter, setDraftExclusiveFilter] = useState(BOOL_FILTER_ALL);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const storeOptions = useMemo(
    () => [
      { value: STORE_FILTER_ALL, label: "All stores" },
      ...stores.map((store) => ({ value: store.id, label: store.name })),
    ],
    [stores]
  );

  // buildQueryUrl resets `page` back to 1 automatically for any update that
  // doesn't itself set `page` — so filter/search changes reset pagination,
  // while pagination controls (which pass `page` explicitly) keep it.
  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildQueryUrl(pathname, searchParams, updates));
  }

  const hasActiveFilters =
    typeFilter !== TYPE_FILTER_ALL ||
    featuredFilter !== BOOL_FILTER_ALL ||
    statusFilter !== BOOL_FILTER_ALL ||
    verifiedFilter !== BOOL_FILTER_ALL ||
    exclusiveFilter !== BOOL_FILTER_ALL;

  function openFilterModal() {
    setDraftTypeFilter(typeFilter);
    setDraftFeaturedFilter(featuredFilter);
    setDraftStatusFilter(statusFilter);
    setDraftVerifiedFilter(verifiedFilter);
    setDraftExclusiveFilter(exclusiveFilter);
    setShowFilterModal(true);
  }

  function applyFilters() {
    navigate({
      type: draftTypeFilter === TYPE_FILTER_ALL ? undefined : draftTypeFilter,
      featured: draftFeaturedFilter === BOOL_FILTER_ALL ? undefined : draftFeaturedFilter,
      status: draftStatusFilter === BOOL_FILTER_ALL ? undefined : draftStatusFilter,
      verified: draftVerifiedFilter === BOOL_FILTER_ALL ? undefined : draftVerifiedFilter,
      exclusive: draftExclusiveFilter === BOOL_FILTER_ALL ? undefined : draftExclusiveFilter,
    });
    setShowFilterModal(false);
  }

  function clearAllFilters() {
    navigate({
      type: undefined,
      featured: undefined,
      status: undefined,
      verified: undefined,
      exclusive: undefined,
    });
  }

  const pagedIds = useMemo(() => coupons.map((c) => c.id), [coupons]);
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
        ids.map((id) => fetch(`/api/admin/coupons/${id}`, { method: "DELETE" }))
      );
      if (results.some((res) => !res.ok)) throw new Error("delete failed");
      toast.success(`Deleted ${ids.length} coupon(s).`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowBulkDeleteConfirm(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete selected coupons.");
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
            placeholder="Search coupons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>

        <div className="w-48">
          <SingleSelectDropdown
            options={storeOptions}
            value={storeFilter}
            onChange={(value) => navigate({ store: value === STORE_FILTER_ALL ? undefined : value })}
            searchable
            searchPlaceholder="Search store..."
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
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
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
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-950">Verified</label>
            <SingleSelectDropdown
              options={verifiedFilterOptions}
              value={draftVerifiedFilter}
              onChange={setDraftVerifiedFilter}
              placeholder="All verified"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-950">Exclusive</label>
            <SingleSelectDropdown
              options={exclusiveFilterOptions}
              value={draftExclusiveFilter}
              onChange={setDraftExclusiveFilter}
              placeholder="All exclusive"
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
          coupon(s)? This can&apos;t be undone.
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
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => {
              const store = storeById.get(coupon.storeId);
              return (
                <tr key={coupon.id} className="border-t border-muted-200">
                  {selectionMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedIds.has(coupon.id)}
                        onChange={() => toggleOne(coupon.id)}
                        aria-label={`Select ${coupon.title}`}
                      />
                    </td>
                  )}
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
                  <td className="px-4 py-3 font-medium text-brand-950">{coupon.title}</td>
                  <td className="px-4 py-3 text-muted-600">{coupon.type}</td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/coupons/${coupon.id}`}
                      field="isFeatured"
                      value={coupon.isFeatured}
                      options={[
                        { value: true, label: "Featured" },
                        { value: false, label: "Not featured" },
                      ]}
                      triggerClassName="w-28"
                      badgeClassName={
                        coupon.isFeatured
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-muted-300 text-muted-500 hover:bg-surface-100"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/coupons/${coupon.id}`}
                      field="isActive"
                      value={coupon.isActive}
                      options={[
                        { value: true, label: "Active" },
                        { value: false, label: "Hidden" },
                      ]}
                      triggerClassName="w-20"
                      badgeClassName={
                        coupon.isActive
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-red-200 bg-red-50 text-red-600"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminDropdownSelect
                      endpoint={`/api/admin/coupons/${coupon.id}`}
                      field="verified"
                      value={coupon.verified}
                      options={[
                        { value: true, label: "Verified" },
                        { value: false, label: "Unverified" },
                      ]}
                      triggerClassName="w-28"
                      badgeClassName={
                        coupon.verified
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-muted-300 text-muted-500 hover:bg-surface-100"
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                    {new Date(coupon.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/coupons/${coupon.id}`}
                        aria-label={`Edit ${coupon.title}`}
                        className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton endpoint={`/api/admin/coupons/${coupon.id}`} confirmLabel={coupon.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={selectionMode ? 9 : 8} className="px-4 py-6 text-center text-muted-500">
                  No coupons found.
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
