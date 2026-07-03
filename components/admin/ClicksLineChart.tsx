"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ClicksSeriesPoint } from "@/lib/data/admin/analytics";

export function ClicksLineChart({ data }: { data: ClicksSeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--muted-200)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, borderColor: "var(--muted-200)", fontSize: 12 }}
          labelFormatter={(label) => `${label}`}
          formatter={(value) => [value, "Clicks"]}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="var(--brand-500)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
