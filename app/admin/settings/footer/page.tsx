import { auth } from "@/auth";
import { getFooterSettings } from "@/lib/data";
import { FooterSettingsForm } from "@/components/admin/FooterSettingsForm";

export default async function AdminFooterSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Footer</h1>
        <p className="mt-4 text-sm text-muted-500">
          Only admins can view and edit footer settings.
        </p>
      </div>
    );
  }

  const settings = await getFooterSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Footer</h1>
      <p className="mt-1 text-sm text-muted-500">
        Link columns shown in the site footer. Up to 4 columns.
      </p>

      <div className="mt-6">
        <FooterSettingsForm settings={settings} />
      </div>
    </div>
  );
}
