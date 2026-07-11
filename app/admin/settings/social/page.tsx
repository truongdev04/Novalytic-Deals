import { auth } from "@/auth";
import { getSocialSettings } from "@/lib/data";
import { SocialSettingsForm } from "@/components/admin/SocialSettingsForm";

export default async function AdminSocialSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-950">Social Network</h1>
        <p className="mt-4 text-sm text-muted-500">
          Only admins can view and edit social network settings.
        </p>
      </div>
    );
  }

  const settings = await getSocialSettings();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Social Network</h1>
      <p className="mt-1 text-sm text-muted-500">
        Social profile links shown in the footer and site-wide structured data.
      </p>

      <div className="mt-6">
        <SocialSettingsForm settings={settings} />
      </div>
    </div>
  );
}
