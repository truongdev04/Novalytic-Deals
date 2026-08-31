import { notFound } from "next/navigation";
import { getSubmittedCouponById } from "@/lib/data";
import { SubmissionEditForm } from "@/components/admin/SubmissionEditForm";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmittedCouponById(id);
  if (!submission) notFound();

  return (
    <div>
      <SubmissionEditForm
        submission={{
          id: submission.id,
          title: submission.title,
          storeName: submission.storeName,
          websiteUrl: submission.websiteUrl,
          code: submission.code,
          discountUnit: submission.discountUnit,
          discountValue: submission.discountValue,
          description: submission.description,
          expiresAt: submission.expiresAt ? submission.expiresAt.toISOString() : null,
          submitterEmail: submission.submitterEmail,
          status: submission.status,
        }}
      />
    </div>
  );
}
