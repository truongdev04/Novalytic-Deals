"use client";

import dynamic from "next/dynamic";
import type { TopStorePoint } from "@/components/admin/TopStoresBarChart";

// `ssr: false` isn't allowed on a next/dynamic call made directly inside a
// Server Component — this client wrapper is what lets app/admin/page.tsx
// (a Server Component) defer the whole `recharts` bundle without paying for
// it on every dashboard load.
const TopStoresBarChart = dynamic(
  () => import("@/components/admin/TopStoresBarChart").then((mod) => mod.TopStoresBarChart),
  {
    ssr: false,
    loading: () => <div className="h-[280px] w-full animate-pulse rounded-lg bg-muted-100" />,
  }
);

export function TopStoresBarChartLazy({ data }: { data: TopStorePoint[] }) {
  return <TopStoresBarChart data={data} />;
}
