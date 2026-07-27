import { getSubmittedCouponsAdminPaginated, getPendingSubmissionCount } from "@/lib/data";
import { SubmissionTable } from "@/components/admin/SubmissionTable";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const [{ items: submissions, total }, pendingCount] = await Promise.all([
    getSubmittedCouponsAdminPaginated(page, pageSize),
    getPendingSubmissionCount(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Coupon submissions</h1>
      <p className="mt-1 text-sm text-muted-500">{pendingCount} pending review.</p>

      <div className="mt-6">
        <SubmissionTable submissions={submissions} total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
