import { Store, Tag, Tags, Network, FileText, Mail, MessageSquare, Inbox } from "lucide-react";
import Link from "next/link";
import {
  getOverviewCounts,
  getTopStoresByClickCount,
  getRecentActivity,
  getModerationCounts,
} from "@/lib/data/admin/analytics";
import { TopStoresBarChart } from "@/components/admin/TopStoresBarChart";
import { AutoFillStoreButton } from "@/components/admin/AutoFillStoreButton";

function formatDate(date: Date) {
  return date.toLocaleDateString("vi-VN");
}

export default async function AdminDashboardPage() {
  const [overview, topStores, recentActivity, moderation] = await Promise.all([
    getOverviewCounts(),
    getTopStoresByClickCount(5),
    getRecentActivity(5),
    getModerationCounts(),
  ]);

  const overviewCards = [
    { label: "Stores", value: overview.stores, icon: Store, tint: "bg-brand-100 text-brand-700" },
    { label: "Coupons", value: overview.coupons, icon: Tag, tint: "bg-brand-100 text-brand-700" },
    { label: "Deals", value: overview.deals, icon: Tags, tint: "bg-brand-100 text-brand-700" },
    { label: "Categories", value: overview.categories, icon: Network, tint: "bg-accent-100 text-accent-700" },
    { label: "Blog Posts", value: overview.blogPosts, icon: FileText, tint: "bg-accent-100 text-accent-700" },
    { label: "Subscribers", value: overview.subscribers, icon: Mail, tint: "bg-accent-100 text-accent-700" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-brand-950">Dashboard</h1>
        <AutoFillStoreButton />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {overviewCards.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-xl border border-muted-200 bg-surface-0 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-500">{label}</p>
                <p className="mt-2 font-heading text-3xl font-bold text-brand-950">{value}</p>
              </div>
              <span className={`rounded-lg p-2 ${tint}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {(moderation.pendingReviews > 0 || moderation.pendingSubmissions > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/reviews"
            className="flex items-center gap-2 rounded-lg border border-muted-200 bg-surface-0 px-3 py-2 text-sm text-brand-950 hover:border-brand-300"
          >
            <MessageSquare className="h-4 w-4 text-muted-500" />
            {moderation.pendingReviews} review đang chờ duyệt
          </Link>
          <Link
            href="/admin/submissions"
            className="flex items-center gap-2 rounded-lg border border-muted-200 bg-surface-0 px-3 py-2 text-sm text-brand-950 hover:border-brand-300"
          >
            <Inbox className="h-4 w-4 text-muted-500" />
            {moderation.pendingSubmissions} coupon gửi lên đang chờ duyệt
          </Link>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-heading text-lg font-semibold text-brand-950">Thống kê click</h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-muted-200 bg-surface-0 p-5">
            <h3 className="font-heading text-sm font-semibold text-brand-950">
              Store có lượng click nhiều nhất (tháng này)
            </h3>
            <div className="mt-2">
              {topStores.length === 0 ? (
                <p className="flex h-[280px] items-center justify-center text-sm text-muted-500">
                  Chưa có dữ liệu click nào.
                </p>
              ) : (
                <TopStoresBarChart data={topStores} />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-muted-200 bg-surface-0 p-5">
          <h3 className="font-heading text-sm font-semibold text-brand-950">Recent Activity</h3>
          <ul className="mt-3 divide-y divide-muted-200">
            {recentActivity.length === 0 && (
              <li className="py-3 text-sm text-muted-500">Chưa có hoạt động nào.</li>
            )}
            {recentActivity.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-brand-950">{item.title}</p>
                  <p className="text-xs text-muted-500">{item.kind}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-400">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
