"use client";

import { useRouter } from "nextjs-toploader/app";
import { usePathname, useSearchParams } from "next/navigation";
import { SubmissionActions } from "@/components/admin/SubmissionActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { buildQueryUrl } from "@/lib/utils";
import type { getSubmittedCouponsAdminPaginated } from "@/lib/data/submittedCoupons";

type Submission = Awaited<ReturnType<typeof getSubmittedCouponsAdminPaginated>>["items"][number];

export function SubmissionTable({
  submissions,
  total,
  page,
  pageSize,
}: {
  submissions: Submission[];
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
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Submitter</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-t border-muted-200">
                <td className="px-4 py-3 font-medium text-brand-950">{submission.storeName}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-muted-600">
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
                <td className="px-4 py-3 text-muted-600">
                  {submission.discountUnit === "%"
                    ? `${submission.discountValue}%`
                    : `${submission.discountUnit}${submission.discountValue}`}
                </td>
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
                <td colSpan={7} className="px-4 py-6 text-center text-muted-500">
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
    </div>
  );
}
