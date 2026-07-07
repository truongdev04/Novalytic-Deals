import { auth } from "@/auth";
import { getIntegrationsSettingsView } from "@/lib/data";
import { IntegrationsSettingsForm } from "@/components/admin/IntegrationsSettingsForm";

export default async function AdminIntegrationsSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Integrations</h1>
        <p className="mt-4 text-sm text-muted-500">
          Only admins can view and edit integration settings.
        </p>
      </div>
    );
  }

  const view = await getIntegrationsSettingsView();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Integrations</h1>
      <p className="mt-1 text-sm text-muted-500">
        Resend, Turnstile, and analytics configuration. Values saved here take precedence over
        environment variables.
      </p>

      <div className="mt-6">
        <IntegrationsSettingsForm view={view} />
      </div>
    </div>
  );
}
