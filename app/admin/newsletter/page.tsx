import {
  getNewsletterSubscribersAdminPaginated,
  getConfirmedActiveSubscriberCount,
} from "@/lib/data";
import { NewsletterTable } from "@/components/admin/NewsletterTable";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants/admin";

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size)) ? Number(params.size) : 20;

  const [{ items: subscribers, total }, confirmedActiveCount] = await Promise.all([
    getNewsletterSubscribersAdminPaginated(page, pageSize),
    getConfirmedActiveSubscriberCount(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-brand-950">Newsletter subscribers</h1>
      <p className="mt-1 text-sm text-muted-500">
        {confirmedActiveCount} confirmed active subscribers of {total} total.
      </p>

      <div className="mt-6">
        <NewsletterTable subscribers={subscribers} total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}
