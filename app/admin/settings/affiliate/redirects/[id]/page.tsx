import { notFound } from "next/navigation";
import { getRedirectRuleById } from "@/lib/data";
import { RedirectRuleForm } from "@/components/admin/RedirectRuleForm";

export default async function EditRedirectRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rule = await getRedirectRuleById(id);
  if (!rule) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Edit redirect rule</h1>
      <div className="mt-6">
        <RedirectRuleForm rule={rule} />
      </div>
    </div>
  );
}
