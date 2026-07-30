import { auth } from "@/auth";
import { getCustomScriptsSettings } from "@/lib/data";
import { CustomScriptsSettingsForm } from "@/components/admin/CustomScriptsSettingsForm";

export default async function AdminCustomScriptsSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Custom Scripts</h1>
        <p className="mt-4 text-sm text-muted-500">
          Only admins can view and edit custom scripts.
        </p>
      </div>
    );
  }

  const settings = await getCustomScriptsSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Custom Scripts</h1>
      <p className="mt-1 text-sm text-muted-500">
        Paste raw HTML/JavaScript to inject site-wide, independent of the ID-based fields in
        Integrations.
      </p>

      <div className="mt-6">
        <CustomScriptsSettingsForm settings={settings} />
      </div>
    </div>
  );
}
