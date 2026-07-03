import { getSubmittedCoupons } from "@/lib/data";
import { SubmissionTable } from "@/components/admin/SubmissionTable";

export default async function AdminSubmissionsPage() {
  const submissions = await getSubmittedCoupons();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Coupon submissions</h1>
      <p className="mt-1 text-sm text-muted-500">
        {submissions.filter((s) => s.status === "PENDING").length} pending review.
      </p>

      <div className="mt-6">
        <SubmissionTable submissions={submissions} />
      </div>
    </div>
  );
}
