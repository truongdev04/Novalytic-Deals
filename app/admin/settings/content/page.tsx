import { auth } from "@/auth";
import { getContentConfigSettings } from "@/lib/data";
import { ContentConfigSettingsForm } from "@/components/admin/ContentConfigSettingsForm";

export default async function AdminContentConfigSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Content Configuration</h1>
        <p className="mt-4 text-sm text-muted-500">
          Only admins can view and edit content configuration settings.
        </p>
      </div>
    );
  }

  const settings = await getContentConfigSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Content Configuration</h1>
      <p className="mt-1 text-sm text-muted-500">
        Listing sizes and auto-fill templates used when a Store or Blog post is left blank.
      </p>

      <div className="mt-6">
        <ContentConfigSettingsForm settings={settings} />
      </div>
    </div>
  );
}
