"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleButton } from "@/components/admin/ToggleButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { RedirectRule } from "@/types";

export function RedirectRuleTable({ rules }: { rules: RedirectRule[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(
      (rule) =>
        rule.source.toLowerCase().includes(q) || rule.destination.toLowerCase().includes(q)
    );
  }, [rules, query]);

  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(filtered);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
        <input
          type="text"
          placeholder="Search redirect rules..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-muted-300 bg-surface-0 py-2 pl-9 pr-3 text-sm text-brand-950 placeholder:text-muted-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((rule) => (
              <tr key={rule.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{rule.source}</td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-600">{rule.destination}</td>
                <td className="px-4 py-3 text-muted-600">
                  {rule.type === "PERMANENT" ? "308 Permanent" : "307 Temporary"}
                </td>
                <td className="px-4 py-3">
                  <ToggleButton
                    endpoint={`/api/admin/redirects/${rule.id}`}
                    field="isActive"
                    value={rule.isActive}
                    label={rule.isActive ? "Active" : "Inactive"}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/settings/affiliate/redirects/${rule.id}`}
                      aria-label={`Edit ${rule.source}`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      endpoint={`/api/admin/redirects/${rule.id}`}
                      confirmLabel={rule.source}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-500">
                  No redirect rules found.
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
