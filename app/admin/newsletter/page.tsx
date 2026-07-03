import { getNewsletterSubscribers } from "@/lib/data";
import { NewsletterTable } from "@/components/admin/NewsletterTable";

export default async function AdminNewsletterPage() {
  const subscribers = await getNewsletterSubscribers();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Newsletter subscribers</h1>
      <p className="mt-1 text-sm text-muted-500">
        {subscribers.filter((s) => s.confirmedAt && !s.unsubscribedAt).length} confirmed active
        subscribers of {subscribers.length} total.
      </p>

      <div className="mt-6">
        <NewsletterTable subscribers={subscribers} />
      </div>
    </div>
  );
}
