import { RedirectRuleForm } from "@/components/admin/RedirectRuleForm";

export default function NewRedirectRulePage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">New redirect rule</h1>
      <div className="mt-6">
        <RedirectRuleForm />
      </div>
    </div>
  );
}
