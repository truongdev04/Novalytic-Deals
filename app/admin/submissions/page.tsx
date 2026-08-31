import {
  getSubmittedCouponsAdminPaginated,
  getPendingSubmissionCount,
  getAllStores,
} from "@/lib/data";
import { SubmissionTable } from "@/components/admin/SubmissionTable";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";

const SUBMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

function parseStatus(value?: string) {
  return SUBMISSION_STATUSES.includes(value as (typeof SUBMISSION_STATUSES)[number])
    ? (value as (typeof SUBMISSION_STATUSES)[number])
    : undefined;
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const filters = { query: params.q || undefined, status: parseStatus(params.status) };

  const [{ items: submissions, total }, pendingCount, stores] = await Promise.all([
    getSubmittedCouponsAdminPaginated(page, pageSize, filters),
    getPendingSubmissionCount(),
    getAllStores(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Coupon submissions</h1>
      <p className="mt-1 text-sm text-muted-500">{pendingCount} pending review.</p>

      <div className="mt-6">
        <SubmissionTable
          submissions={submissions}
          stores={stores.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
          total={total}
          page={page}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
