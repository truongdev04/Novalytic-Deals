import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getAffiliateSettings,
  getAllRedirectRules,
  getEffectiveDefaultAffiliateNetwork,
} from "@/lib/data";
import { AffiliateSettingsForm } from "@/components/admin/AffiliateSettingsForm";
import { RedirectRuleTable } from "@/components/admin/RedirectRuleTable";

export default async function AdminAffiliateSettingsPage() {
  const [settings, effectiveDefaultAffiliateNetwork, rules] = await Promise.all([
    getAffiliateSettings(),
    getEffectiveDefaultAffiliateNetwork(),
    getAllRedirectRules(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Affiliate & Redirects</h1>
      <p className="mt-1 text-sm text-muted-500">
        Default affiliate network and site-wide redirect rules.
      </p>

      <div className="mt-6">
        <AffiliateSettingsForm
          settings={settings}
          effectiveDefaultAffiliateNetwork={effectiveDefaultAffiliateNetwork}
        />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-brand-950">Redirect rules</h2>
        <Link
          href="/admin/settings/affiliate/redirects/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add rule
        </Link>
      </div>
      <div className="mt-4">
        <RedirectRuleTable rules={rules} />
      </div>
    </div>
  );
}
