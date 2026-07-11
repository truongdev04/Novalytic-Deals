import { auth } from "@/auth";
import { getSeoSettings } from "@/lib/data";
import { SeoSettingsForm } from "@/components/admin/SeoSettingsForm";

export default async function AdminSeoSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">SEO</h1>
        <p className="mt-4 text-sm text-muted-500">Only admins can view and edit SEO settings.</p>
      </div>
    );
  }

  const settings = await getSeoSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">SEO</h1>
      <p className="mt-1 text-sm text-muted-500">
        Site-wide SEO defaults used when a page doesn&apos;t set its own values.
      </p>

      <div className="mt-6">
        <SeoSettingsForm settings={settings} />
      </div>
    </div>
  );
}
