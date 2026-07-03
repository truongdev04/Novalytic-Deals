"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TopStorePoint {
  storeName: string;
  clicks: number;
}

export function TopStoresBarChart({ data }: { data: TopStorePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-200)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="storeName"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: "var(--muted-200)", fontSize: 12 }}
          formatter={(value) => [value, "Clicks"]}
        />
        <Bar dataKey="clicks" fill="var(--accent-400)" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
