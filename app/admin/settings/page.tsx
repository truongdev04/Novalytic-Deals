import { getSiteMeta } from "@/lib/data";
import { SiteMetaForm } from "@/components/admin/SiteMetaForm";

export default async function AdminSettingsPage() {
  const meta = await getSiteMeta();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Settings</h1>
      <p className="mt-1 text-sm text-muted-500">
        Site metadata used for SEO defaults. Integrations (Resend, Turnstile, Analytics) and
        affiliate network configuration are set via environment variables — see{" "}
        <code>.env.example</code>.
      </p>

      <div className="mt-6">
        <SiteMetaForm meta={meta} />
      </div>
    </div>
  );
}
