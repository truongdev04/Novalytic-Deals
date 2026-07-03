"use client";

import { SubmissionActions } from "@/components/admin/SubmissionActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/hooks/useAdminPagination";
import type { getSubmittedCoupons } from "@/lib/data/submittedCoupons";

type Submission = Awaited<ReturnType<typeof getSubmittedCoupons>>[number];

export function SubmissionTable({ submissions }: { submissions: Submission[] }) {
  const { page, pageSize, paged, total, setPage, setPageSize } = useAdminPagination(submissions);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-muted-200 bg-surface-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-100 text-xs uppercase text-muted-500">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Submitter</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((submission) => (
              <tr key={submission.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{submission.storeName}</td>
                <td className="px-4 py-3 text-muted-600">{submission.code ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-600">
                  {submission.description}
                </td>
                <td className="px-4 py-3 text-muted-600">{submission.submitterEmail}</td>
                <td className="px-4 py-3 text-right">
                  <SubmissionActions id={submission.id} status={submission.status} />
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-500">
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
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
