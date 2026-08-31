"use client";

import { useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, Columns as ColumnsIcon, Filter, Search, X } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ApproveSubmissionDialog } from "@/components/admin/ApproveSubmissionDialog";
import { SingleSelectDropdown } from "@/components/admin/SingleSelectDropdown";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { buildQueryUrl, cn } from "@/lib/utils";
import type { getSubmittedCouponsAdminPaginated } from "@/lib/data/submittedCoupons";

type Submission = Awaited<ReturnType<typeof getSubmittedCouponsAdminPaginated>>["items"][number];

// Store / Website / Code / Discount / Title / Submitter / Status / Action are
// always shown; the Columns picker only adds these extra fields, off by
// default.
const OPTIONAL_COLUMNS = [
  { key: "expiresAt", label: "Expires at" },
  { key: "createdAt", label: "Received" },
] as const;
type OptionalColumnKey = (typeof OPTIONAL_COLUMNS)[number]["key"];
const DEFAULT_LOCKED_COLUMNS = [
  "Store",
  "Website",
  "Code",
  "Discount",
  "Title",
  "Submitter",
  "Status",
  "Action",
];

const STATUS_FILTER_ALL = "all";
const statusFilterOptions = [
  { value: STATUS_FILTER_ALL, label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function statusBadgeClass(status: Submission["status"]) {
  if (status === "APPROVED") return "bg-brand-50 text-brand-700";
  if (status === "REJECTED") return "bg-red-50 text-red-600";
  return "bg-accent-50 text-accent-700";
}

export function SubmissionTable({
  submissions,
  stores,
  total,
  page,
  pageSize,
}: {
  submissions: Submission[];
  stores: { id: string; name: string; slug: string }[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<OptionalColumnKey>>(new Set());
  const [draftVisibleColumns, setDraftVisibleColumns] = useState<Set<OptionalColumnKey>>(new Set());
  const [approveTarget, setApproveTarget] = useState<Submission | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const urlQuery = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? STATUS_FILTER_ALL;
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(query);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [draftStatusFilter, setDraftStatusFilter] = useState(STATUS_FILTER_ALL);

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildQueryUrl(pathname, searchParams, updates));
  }

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    navigate({ q: debouncedQuery || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  function openFilterModal() {
    setDraftStatusFilter(statusFilter);
    setShowFilterModal(true);
  }

  function applyFilters() {
    navigate({ status: draftStatusFilter === STATUS_FILTER_ALL ? undefined : draftStatusFilter });
    setShowFilterModal(false);
  }

  function openColumnsModal() {
    setDraftVisibleColumns(new Set(visibleColumns));
    setShowColumnsModal(true);
  }

  function toggleDraftColumn(key: OptionalColumnKey) {
    setDraftVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function applyColumns() {
    setVisibleColumns(draftVisibleColumns);
    setShowColumnsModal(false);
  }

  async function reject(id: string) {
    setRejectingId(id);
    try {
      const res = await fetch(`/api/admin/submitted-coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (!res.ok) throw new Error("reject failed");
      router.refresh();
    } catch {
      toast.error("Failed to reject submission.");
    } finally {
      setRejectingId(null);
    }
  }

  const lockedCount = DEFAULT_LOCKED_COLUMNS.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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

        {statusFilter !== STATUS_FILTER_ALL && (
          <button
            type="button"
            onClick={() => navigate({ status: undefined })}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Clear All
          </button>
        )}

        <button
          type="button"
          onClick={openColumnsModal}
          className="flex items-center gap-1.5 rounded-lg border border-muted-300 bg-surface-0 px-3 py-2 text-sm font-medium text-brand-950 hover:bg-surface-100"
        >
          <ColumnsIcon className="h-4 w-4" />
          Columns
        </button>
      </div>

      <Modal open={showFilterModal} onOpenChange={setShowFilterModal} title="Filters">
        <div className="space-y-4">
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

      <Modal open={showColumnsModal} onOpenChange={setShowColumnsModal}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-brand-950">Columns</h2>
          <button
            type="button"
            onClick={() => setDraftVisibleColumns(new Set())}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Reset
          </button>
        </div>

        <div className="space-y-3">
          {DEFAULT_LOCKED_COLUMNS.map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm text-muted-400">
              <input type="checkbox" checked disabled className="h-4 w-4" />
              {label}
            </label>
          ))}
          {OPTIONAL_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2 text-sm text-brand-950">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={draftVisibleColumns.has(col.key)}
                onChange={() => toggleDraftColumn(col.key)}
              />
              {col.label}
            </label>
          ))}
        </div>

        <Button variant="primary" className="mt-5 w-full" onClick={applyColumns}>
          Apply columns
        </Button>
      </Modal>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="w-64 min-w-64 px-4 py-3">Title</th>
              <th className="px-4 py-3">Submitter</th>
              <th className="px-4 py-3">Status</th>
              {visibleColumns.has("expiresAt") && <th className="px-4 py-3">Expires at</th>}
              {visibleColumns.has("createdAt") && <th className="px-4 py-3">Received</th>}
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                className="cursor-pointer border-t border-muted-200 hover:bg-surface-50"
              >
                <td className="px-4 py-3 font-medium text-brand-950">{submission.storeName}</td>
                <td
                  className="max-w-[180px] truncate px-4 py-3 text-muted-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={submission.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {submission.websiteUrl}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted-600">{submission.code ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                  {submission.discountUnit === "%"
                    ? `${submission.discountValue}%`
                    : `${submission.discountUnit}${submission.discountValue}`}
                </td>
                <td className="w-64 min-w-64 max-w-64 px-4 py-3 font-medium text-brand-950">
                  <span className="line-clamp-2">{submission.title || "—"}</span>
                </td>
                <td className="px-4 py-3 text-muted-600">{submission.submitterEmail}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium uppercase",
                      statusBadgeClass(submission.status)
                    )}
                  >
                    {submission.status}
                  </span>
                </td>
                {visibleColumns.has("expiresAt") && (
                  <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                    {submission.expiresAt
                      ? new Date(submission.expiresAt).toLocaleDateString("en-US")
                      : "—"}
                  </td>
                )}
                {visibleColumns.has("createdAt") && (
                  <td className="whitespace-nowrap px-4 py-3 text-muted-600">
                    {new Date(submission.createdAt).toLocaleDateString("en-US")}
                  </td>
                )}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {submission.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setApproveTarget(submission)}
                          aria-label="Approve submission"
                          className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => reject(submission.id)}
                          disabled={rejectingId === submission.id}
                          aria-label="Reject submission"
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <DeleteButton
                      endpoint={`/api/admin/submitted-coupons/${submission.id}`}
                      confirmLabel={submission.title || submission.storeName}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td
                  colSpan={lockedCount + visibleColumns.size}
                  className="px-4 py-6 text-center text-muted-500"
                >
                  No submissions found.
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

      {approveTarget && (
        <ApproveSubmissionDialog
          submission={{
            id: approveTarget.id,
            title: approveTarget.title,
            storeName: approveTarget.storeName,
            websiteUrl: approveTarget.websiteUrl,
            code: approveTarget.code,
            discountUnit: approveTarget.discountUnit,
            discountValue: approveTarget.discountValue,
            description: approveTarget.description,
            expiresAt: approveTarget.expiresAt
              ? new Date(approveTarget.expiresAt).toISOString()
              : null,
          }}
          stores={stores}
          open={approveTarget !== null}
          onOpenChange={(open) => !open && setApproveTarget(null)}
        />
      )}
    </div>
  );
}
