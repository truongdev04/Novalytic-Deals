import { getGeneralSettings } from "@/lib/data";
import { GeneralSettingsForm } from "@/components/admin/GeneralSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getGeneralSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">General</h1>
      <p className="mt-1 text-sm text-muted-500">
        Site metadata and SEO defaults used across the public site.
      </p>

      <div className="mt-6">
        <GeneralSettingsForm settings={settings} />
      </div>
    </div>
  );
}
